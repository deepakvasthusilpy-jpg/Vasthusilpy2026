import React, { useState, useEffect } from "react";
import { X, Sparkles, Clock, Shield, Check, Copy, MessageCircle, ExternalLink, Link2, FileSpreadsheet, Lock, Eye, Calendar } from "lucide-react";
import { EstimateProject } from "../../../data/estimateData";
import { ClientShareLink } from "../../../types";
import { createClientShareLink, buildClientShareUrl } from "../../../data/clientShareData";

interface NewClientLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimateProjects: EstimateProject[];
  onCreated: (newLink: ClientShareLink) => void;
}

const DURATION_OPTIONS = [
  { hours: 24, label: "24 Hours (1 Day)", desc: "Quick 1-day progress review" },
  { hours: 72, label: "3 Days", desc: "Short site update review" },
  { hours: 168, label: "7 Days (1 Week)", desc: "Standard weekly client review" },
  { hours: 336, label: "14 Days (2 Weeks)", desc: "Fortnightly milestone check" },
  { hours: 720, label: "30 Days (1 Month)", desc: "Full monthly stage validity" },
  { hours: -1, label: "Custom Expiry Date", desc: "Select specific date & time" }
];

export const NewClientLinkModal: React.FC<NewClientLinkModalProps> = ({
  isOpen,
  onClose,
  estimateProjects,
  onCreated
}) => {
  const [selectedEstimateId, setSelectedEstimateId] = useState<string>("");
  const [selectedDurationHours, setSelectedDurationHours] = useState<number>(168); // default 7 days
  const [customExpiryDate, setCustomExpiryDate] = useState<string>("");
  const [progressPercentage, setProgressPercentage] = useState<number>(65);
  const [customStageStatus, setCustomStageStatus] = useState<string>("Ground floor brick masonry & lintel beam reinforcement completed");
  const [allowStageExpenditure, setAllowStageExpenditure] = useState<boolean>(true);
  const [allowWorkItemsBreakdown, setAllowWorkItemsBreakdown] = useState<boolean>(true);
  const [allowDownloadPdf, setAllowDownloadPdf] = useState<boolean>(true);
  const [allowEngineerSeal, setAllowEngineerSeal] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Success result state
  const [createdLink, setCreatedLink] = useState<ClientShareLink | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Default selection when opened
  useEffect(() => {
    if (isOpen && estimateProjects.length > 0) {
      if (!selectedEstimateId || !estimateProjects.some(p => p.id === selectedEstimateId)) {
        const first = estimateProjects[0];
        setSelectedEstimateId(first.id);
        setCustomStageStatus(first.stageCompletedText || "Construction & stage work in progress");
        // Calculate progress percentage if stage expenditure exists
        if (first.grandTotal > 0 && first.stageExpenditure > 0) {
          const pct = Math.min(100, Math.round((first.stageExpenditure / first.grandTotal) * 100));
          setProgressPercentage(pct);
        }
      }
      setCreatedLink(null);
      setCopied(false);
      
      // Default custom date to 14 days ahead
      const next14 = new Date(Date.now() + 14 * 24 * 3600 * 1000);
      setCustomExpiryDate(next14.toISOString().split("T")[0]);
    }
  }, [isOpen, estimateProjects]);

  // When estimate changes, update stage info
  const handleEstimateChange = (id: string) => {
    setSelectedEstimateId(id);
    const found = estimateProjects.find(p => p.id === id);
    if (found) {
      setCustomStageStatus(found.stageCompletedText || "Construction & stage work in progress");
      if (found.grandTotal > 0 && found.stageExpenditure > 0) {
        const pct = Math.min(100, Math.round((found.stageExpenditure / found.grandTotal) * 100));
        setProgressPercentage(pct);
      }
    }
  };

  if (!isOpen) return null;

  const currentProject = estimateProjects.find(p => p.id === selectedEstimateId) || estimateProjects[0];

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    setIsSubmitting(true);
    try {
      const selectedOption = DURATION_OPTIONS.find(o => o.hours === selectedDurationHours);
      const isCustom = selectedDurationHours === -1;
      
      let durationHours = selectedDurationHours;
      let durationLabel = selectedOption?.label.split(" (")[0] || "Custom";
      let customExpiresAt: string | undefined = undefined;

      if (isCustom && customExpiryDate) {
        const targetDate = new Date(`${customExpiryDate}T23:59:59`);
        customExpiresAt = targetDate.toISOString();
        const diffMs = targetDate.getTime() - Date.now();
        durationHours = Math.max(1, Math.round(diffMs / (1000 * 3600)));
        durationLabel = `Until ${new Date(customExpiresAt).toLocaleDateString("en-IN")}`;
      }

      const newLink = await createClientShareLink({
        estimateId: currentProject.id,
        estimateProjectName: `${currentProject.clientName} - ${currentProject.houseName} (${currentProject.buildingType})`,
        clientName: currentProject.clientName,
        clientPhone: currentProject.clientPhone,
        houseName: currentProject.houseName,
        location: `${currentProject.panchayatVillage}, ${currentProject.districtPincode}`,
        durationHours,
        durationLabel,
        customExpiresAt,
        allowStageExpenditure,
        allowWorkItemsBreakdown,
        allowDownloadPdf,
        allowEngineerSeal,
        progressPercentage,
        customStageStatus,
        accessPin: "",
        customNote: customNote || "Direct Zero-Login Client Progress Access"
      });

      setCreatedLink(newLink);
      onCreated(newLink);
    } catch (err) {
      console.error("Failed to create client share link", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareUrl = createdLink ? buildClientShareUrl(createdLink.token) : "";

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!createdLink) return;
    const text = encodeURIComponent(
      `*Vasthusilpy - Project Progress & Certificate View*\n` +
      `Dear ${createdLink.clientName},\n\n` +
      `You can review the live work progress & stage certificate of your project *${createdLink.estimateProjectName}* at the link below:\n\n` +
      `🔗 ${shareUrl}\n\n` +
      `✨ *No Login Required:* Click the link to view directly on your phone or PC.\n` +
      `⏳ This link is valid until ${new Date(createdLink.expiresAt).toLocaleDateString("en-IN")}.\n\n` +
      `Vasthusilpy Technical System - Keralassery\n📞 +91 70123 83137`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-sans flex items-center gap-2">
                <span>Create Client View Link</span>
                <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full">
                  TIME-LIMITED LINK
                </span>
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Generate unauthenticated, read-only status & progress review link
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {createdLink ? (
          /* SUCCESS VIEW */
          <div className="p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-3.5 shadow-lg">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Check className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-emerald-300 font-sans">
                  Client link created successfully! (Link Ready)
                </div>
                <p className="text-xs text-slate-300">
                  Clients can use this link to check live project progress and estimates without logging in.
                </p>
              </div>
            </div>

            {/* Link Preview Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">Client:</span>
                <span className="font-bold text-white">{createdLink.clientName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">Project:</span>
                <span className="font-mono text-cyan-300 truncate max-w-[280px]">{createdLink.estimateProjectName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">Valid Until:</span>
                <span className="font-mono font-bold text-amber-400">
                  {new Date(createdLink.expiresAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })} ({createdLink.durationLabel})
                </span>
              </div>
              {createdLink.accessPin && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="font-mono text-slate-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Security PIN:
                  </span>
                  <span className="font-mono font-black text-emerald-400 text-sm tracking-widest">
                    {createdLink.accessPin}
                  </span>
                </div>
              )}

              {/* URL Box */}
              <div className="pt-2">
                <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-slate-200 truncate select-all">{shareUrl}</span>
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-lg text-xs font-mono flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleShareWhatsApp}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </button>

              <button
                onClick={() => window.open(shareUrl, "_blank")}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>Test Live Preview</span>
              </button>

              <button
                onClick={onClose}
                className="py-3 px-4 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Done / Close</span>
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleGenerateLink} className="p-6 md:p-8 space-y-6">
            {/* Step 1: Select Estimate Project */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                  Select Estimate Project:
                </span>
                <span className="text-[11px] text-slate-500">
                  {estimateProjects.length} Projects Available
                </span>
              </label>

              <select
                value={selectedEstimateId}
                onChange={(e) => handleEstimateChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white font-sans focus:outline-none focus:border-cyan-500 cursor-pointer"
                required
              >
                {estimateProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} • {p.clientName} - {p.houseName} ({p.plinthAreaSqFt} Sq.Ft • ₹{p.grandTotal.toLocaleString("en-IN")})
                  </option>
                ))}
              </select>

              {currentProject && (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Location: <strong className="text-slate-200">{currentProject.panchayatVillage}, {currentProject.districtPincode}</strong></span>
                  <span>Estimate Total: <strong className="text-emerald-400">₹{currentProject.grandTotal.toLocaleString("en-IN")}</strong></span>
                </div>
              )}
            </div>

            {/* Step 2: Time-limited Expiry Presets */}
            <div className="space-y-2.5">
              <label className="block text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Link Validity & Expiry:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setSelectedDurationHours(opt.hours)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedDurationHours === opt.hours
                        ? "bg-cyan-950/80 border-cyan-500 text-white shadow-md shadow-cyan-500/10"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <div className="text-xs font-mono font-bold flex items-center justify-between">
                      <span>{opt.label}</span>
                      {selectedDurationHours === opt.hours && (
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>

              {selectedDurationHours === -1 && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Select Custom Expiry Date:
                  </label>
                  <input
                    type="date"
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              )}
            </div>

            {/* Step 3: Construction Progress & Stage Details */}
            <div className="space-y-3 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-300">
                  Site Progress Percentage:
                </label>
                <span className="text-sm font-mono font-black text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {progressPercentage}% Completed
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">
                  Current Certified Stage Status:
                </label>
                <input
                  type="text"
                  value={customStageStatus}
                  onChange={(e) => setCustomStageStatus(e.target.value)}
                  placeholder="e.g. Ground floor brick masonry & lintel beam completed"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Step 4: Feature View Toggles & PIN Protection */}
            <div className="space-y-3">
              <label className="block text-xs font-mono font-bold text-slate-300">
                Display Options & Permissions:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={allowStageExpenditure}
                    onChange={(e) => setAllowStageExpenditure(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-mono text-slate-200 block">Stage Expenditure Valuation</span>
                    <span className="text-[10px] text-slate-500">Show certified work expenditure to date</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={allowWorkItemsBreakdown}
                    onChange={(e) => setAllowWorkItemsBreakdown(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-mono text-slate-200 block">Items of Work (BOQ)</span>
                    <span className="text-[10px] text-slate-500">Allow client to expand work item rates</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={allowEngineerSeal}
                    onChange={(e) => setAllowEngineerSeal(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-mono text-slate-200 block">Engineer Seal & Sign</span>
                    <span className="text-[10px] text-slate-500">Show official verification credentials</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={allowDownloadPdf}
                    onChange={(e) => setAllowDownloadPdf(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-mono text-slate-200 block">Print & Save Report</span>
                    <span className="text-[10px] text-slate-500">Allow client to print/save progress PDF</span>
                  </div>
                </label>
              </div>

              {/* Zero-Login Direct Access Assurance */}
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-mono font-black text-emerald-300 flex items-center gap-2">
                    <span>100% Zero-Login Access Enabled (No Login Required)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Clients can click the WhatsApp link to instantly view site progress and stage certificates without installing an app or entering passwords.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !currentProject}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs font-mono shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? "Generating Link..." : "Generate Client Link"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
