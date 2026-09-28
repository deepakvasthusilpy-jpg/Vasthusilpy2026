import React, { useState, useEffect } from "react";
import { SiteInspection, InspectionStatus } from "../../types/siteInspection";
import {
  loadSiteInspections,
  saveSiteInspections,
  deleteSiteInspection,
  downloadInspectionPdf,
  downloadInspectionArchive,
  downloadAllInspectionsArchive,
  sendWhatsAppNotification,
  getDeletedInspectionIds
} from "../../utils/siteInspectionManager";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { InspectionDetailModal } from "./InspectionDetailModal";
import { InspectionEmailModal } from "./InspectionEmailModal";
import { InspectionTelegramModal } from "./InspectionTelegramModal";
import { InspectionMediaViewer } from "./InspectionMediaViewer";
import { triggerAppNotification } from "../../context/NotificationContext";
import {
  Search,
  FileText,
  Download,
  Share2,
  Trash2,
  Eye,
  MapPin,
  Camera,
  Calendar,
  User,
  Phone,
  Filter,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Mail,
  Send,
  Archive,
  CheckSquare,
  Square,
  Maximize2,
  Video,
  Layers,
  FolderArchive,
  Sparkles,
  Cloud
} from "lucide-react";

interface InspectionDashboardProps {
  onNewInspectionClick?: () => void;
}

export const InspectionDashboard: React.FC<InspectionDashboardProps> = ({
  onNewInspectionClick
}) => {
  const [inspections, setInspections] = useState<SiteInspection[]>(() => loadSiteInspections());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedInspection, setSelectedInspection] = useState<SiteInspection | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [emailModalInspection, setEmailModalInspection] = useState<SiteInspection | null>(null);
  const [telegramModalInspection, setTelegramModalInspection] = useState<SiteInspection | null>(null);

  // Selected for batch download
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgressStep, setBatchProgressStep] = useState<string>("");
  const [downloadingCardId, setDownloadingCardId] = useState<string | null>(null);

  // Media lightbox state
  const [activeMediaViewerInspection, setActiveMediaViewerInspection] = useState<SiteInspection | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);

  // Sync with Firestore & localStorage events
  useEffect(() => {
    let isMounted = true;
    let unsub = () => {};

    if (db) {
      try {
        unsub = onSnapshot(
          collection(db, "site_inspections"),
          (snapshot) => {
            if (!isMounted) return;
            const deletedIds = getDeletedInspectionIds();
            if (!snapshot.empty) {
              const remote: SiteInspection[] = [];
              snapshot.forEach((d) => {
                const data = d.data() as SiteInspection;
                if (data && data.id && !deletedIds.includes(data.id)) {
                  remote.push(data);
                }
              });
              setInspections((prev) => {
                const sorted = remote.sort(
                  (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                );
                return sorted;
              });
              saveSiteInspections(remote, false);
            } else {
              // snapshot is empty
              setInspections([]);
            }
          },
          () => {}
        );
      } catch (e) {}
    }

    const handleUpdate = () => {
      setInspections(loadSiteInspections());
    };
    window.addEventListener("vasthusilpy_site_inspections_updated", handleUpdate);

    return () => {
      isMounted = false;
      unsub();
      window.removeEventListener("vasthusilpy_site_inspections_updated", handleUpdate);
    };
  }, []);

  const handleDelete = (id: string, inspectionNumber?: string) => {
    const confirmMsg = `Are you sure you want to permanently delete inspection ${inspectionNumber || id}? This will remove all attached responses, metadata, and photos.`;
    if (window.confirm(confirmMsg)) {
      const updated = deleteSiteInspection(id);
      setInspections(updated);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      if (selectedInspection?.id === id) {
        setIsDetailModalOpen(false);
        setSelectedInspection(null);
      }
      triggerAppNotification(`Inspection record ${inspectionNumber || ""} permanently deleted.`, "info");
    }
  };

  const handleStatusChange = (id: string, newStatus: InspectionStatus) => {
    const updated = inspections.map((i) =>
      i.id === id ? { ...i, status: newStatus, updatedAt: new Date().toISOString() } : i
    );
    setInspections(updated);
    saveSiteInspections(updated);
    triggerAppNotification(`Inspection status updated to ${newStatus.toUpperCase()}`, "success");
  };

  // Filtered list
  const filteredInspections = inspections.filter((item) => {
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.inspectionNumber.toLowerCase().includes(q) ||
      item.ownerName.toLowerCase().includes(q) ||
      item.mobileNumber.toLowerCase().includes(q) ||
      item.place.toLowerCase().includes(q) ||
      (item.panchayathMunicipality && item.panchayathMunicipality.toLowerCase().includes(q)) ||
      (item.surveyNumber && item.surveyNumber.toLowerCase().includes(q)) ||
      (item.inspectorName && item.inspectorName.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // Single card download package
  const handleDownloadSingleArchive = async (item: SiteInspection) => {
    try {
      setDownloadingCardId(item.id);
      triggerAppNotification(`Packaging full inspection for ${item.ownerName} (${item.inspectionNumber})...`, "info");
      await downloadInspectionArchive(item);
      triggerAppNotification(`Package for ${item.inspectionNumber} downloaded successfully!`, "success");
    } catch (err: any) {
      triggerAppNotification(err?.message || "Failed to download package.", "error");
    } finally {
      setDownloadingCardId(null);
    }
  };

  // Batch download selected or all
  const handleDownloadBatch = async (itemsToDownload: SiteInspection[]) => {
    if (itemsToDownload.length === 0) {
      triggerAppNotification("No inspections selected for download.", "warning");
      return;
    }
    try {
      setIsBatchDownloading(true);
      setBatchProgressStep("Preparing master archive...");
      await downloadAllInspectionsArchive(itemsToDownload, (pct, step) => {
        setBatchProgressStep(`${step} (${pct}%)`);
      });
      triggerAppNotification(`Master archive with ${itemsToDownload.length} inspections downloaded!`, "success");
    } catch (err: any) {
      triggerAppNotification(err?.message || "Failed to create master archive.", "error");
    } finally {
      setIsBatchDownloading(false);
      setBatchProgressStep("");
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.length === filteredInspections.length && filteredInspections.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInspections.map((i) => i.id));
    }
  };

  const selectedInspectionsList = inspections.filter((i) => selectedIds.includes(i.id));

  return (
    <div className="space-y-5 pb-20">
      {/* 1. TOP HEADER & BATCH ACTION CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Admin Inspections Dashboard</span>
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                {inspections.length} Total Submissions
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Review field submissions, view photos fit-to-screen, download full PDF + Media packages (.ZIP) & dispatch reports
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Google Drive Cloud Backup Button */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("vasthusilpy_open_gdrive_backup", { detail: { tab: "backup" } }));
              }}
              className="px-4 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold rounded-2xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
              title="Backup all inspection reports, answers, GPS data, photos metadata & site data to Google Drive Cloud Drive"
            >
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Backup to Google Drive</span>
            </button>

            {/* Download ALL Button */}
            <button
              onClick={() => handleDownloadBatch(filteredInspections)}
              disabled={isBatchDownloading || filteredInspections.length === 0}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
              title="Download all inspections with PDFs, photos and summaries in one master ZIP"
            >
              <FolderArchive className="w-4 h-4" />
              <span>
                {isBatchDownloading
                  ? batchProgressStep || "Packaging..."
                  : `Download All Package (${filteredInspections.length})`}
              </span>
            </button>

            {onNewInspectionClick && (
              <button
                onClick={onNewInspectionClick}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ New Inspection</span>
              </button>
            )}
          </div>
        </div>

        {/* Search, Filter & Bulk Selection Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Select All Checkbox */}
            {filteredInspections.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-mono flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                {selectedIds.length === filteredInspections.length && filteredInspections.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>Select All ({filteredInspections.length})</span>
              </button>
            )}

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Owner, Ref No, Place, Mobile, Survey No..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {["ALL", "submitted", "approved", "under_review", "action_required"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize shrink-0 transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {st === "ALL" ? "All Status" : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Items Floating Action Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-emerald-200 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>{selectedIds.length}</strong> of {filteredInspections.length} inspections selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadBatch(selectedInspectionsList)}
                disabled={isBatchDownloading}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Selected Package ({selectedIds.length} ZIP)</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono transition cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. INSPECTIONS GRID */}
      {filteredInspections.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No inspections found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery
              ? `No inspections matched "${searchQuery}".`
              : "No site inspections submitted yet. Start by filling the Mobile Inspection Form."}
          </p>
          {onNewInspectionClick && (
            <button
              onClick={onNewInspectionClick}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Fill Field Inspection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInspections.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isCardDownloading = downloadingCardId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-3xl p-5 space-y-3.5 shadow-xl transition-all flex flex-col justify-between relative ${
                  isSelected ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Card Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(item.id)}
                        className="p-1 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                        title="Select inspection"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-emerald-400 font-mono font-bold border border-slate-800">
                          {item.inspectionNumber}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1 line-clamp-1">
                          {item.ownerName}
                        </h3>
                      </div>
                    </div>

                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as InspectionStatus)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-emerald-400 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Reviewing</option>
                      <option value="approved">Approved</option>
                      <option value="action_required">Action Req.</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Details snippet */}
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-2xl space-y-1 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-mono flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" /> Place:
                      </span>
                      <span className="font-semibold text-white truncate max-w-[150px]">{item.place}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> Mobile:
                      </span>
                      <span className="font-mono text-slate-200">{item.mobileNumber}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> Date:
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(item.dateTime).toLocaleDateString()}
                      </span>
                    </div>

                    {item.surveyNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-mono">Survey No:</span>
                        <span className="text-cyan-300 font-mono text-[11px]">{item.surveyNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* GPS Indicator & Media Counts */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                    {item.gps ? (
                      <a
                        href={item.gps.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline"
                        title="Open GPS Location in Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>GPS ±{item.gps.accuracy || 0}m</span>
                      </a>
                    ) : (
                      <span className="text-slate-500">No GPS Tag</span>
                    )}

                    {item.media && item.media.length > 0 && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        {item.media.length} files attached
                      </span>
                    )}
                  </div>

                  {/* Media Thumbnail Gallery Preview (Fit-To-View on Click) */}
                  {item.media && item.media.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                        Media Preview (Click to view full screen):
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {item.media.slice(0, 4).map((m, mIdx) => (
                          <div
                            key={m.id || mIdx}
                            onClick={() => {
                              setActiveMediaViewerInspection(item);
                              setActiveMediaIndex(mIdx);
                            }}
                            className="group relative h-14 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500/60 cursor-pointer shadow-sm transition"
                            title={`View ${m.name} in fit-to-view viewer`}
                          >
                            {m.type === "photo" ? (
                              <img src={m.url} alt={m.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                            ) : (
                              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-purple-400">
                                <Video className="w-4 h-4" />
                                <span className="text-[7px] font-mono font-bold">VIDEO</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Maximize2 className="w-3 h-3 text-white" />
                            </div>
                            {item.media.length > 4 && mIdx === 3 && (
                              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-white text-[10px] font-bold font-mono">
                                +{item.media.length - 3}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  {/* Primary Package Download Button on every card */}
                  <button
                    onClick={() => handleDownloadSingleArchive(item)}
                    disabled={isCardDownloading}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition cursor-pointer disabled:opacity-50"
                    title="Download A4 PDF Report, high-res photos, videos and JSON bundled together (.ZIP)"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{isCardDownloading ? "Packaging ZIP..." : "Download Full Package (PDF + Photos + Docs)"}</span>
                  </button>

                  {/* Secondary Quick Action Row */}
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedInspection(item);
                        setIsDetailModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Details</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Telegram */}
                      <button
                        onClick={() => setTelegramModalInspection(item)}
                        className="p-1.5 text-sky-400 hover:text-sky-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                        title="Send RAR/ZIP Archive to Telegram (+91 9747995961)"
                      >
                        <Send className="w-4 h-4" />
                      </button>

                      {/* Email */}
                      <button
                        onClick={() => setEmailModalInspection(item)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                        title="Send Email Report to Deepak Sir"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      {/* PDF Report */}
                      <button
                        onClick={() => downloadInspectionPdf(item)}
                        className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                        title="Download A4 PDF Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* WhatsApp */}
                      <button
                        onClick={() => sendWhatsAppNotification(item)}
                        className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                        title="Send WhatsApp Summary (+918848241463)"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item.id, item.inspectionNumber)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspection Detail Modal */}
      <InspectionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedInspection(null);
        }}
        inspection={selectedInspection}
        onDelete={(id) => handleDelete(id, selectedInspection?.inspectionNumber)}
      />

      {/* Email Dispatch Modal */}
      <InspectionEmailModal
        isOpen={!!emailModalInspection}
        onClose={() => setEmailModalInspection(null)}
        inspection={emailModalInspection}
      />

      {/* Telegram Dispatch Modal */}
      <InspectionTelegramModal
        isOpen={!!telegramModalInspection}
        onClose={() => setTelegramModalInspection(null)}
        inspection={telegramModalInspection}
      />

      {/* Media Lightbox Viewer (Fit-To-View) */}
      <InspectionMediaViewer
        isOpen={activeMediaViewerInspection !== null}
        onClose={() => setActiveMediaViewerInspection(null)}
        mediaList={activeMediaViewerInspection?.media || []}
        initialIndex={activeMediaIndex}
        inspection={activeMediaViewerInspection}
      />
    </div>
  );
};
