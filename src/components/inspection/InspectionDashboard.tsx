import React, { useState, useEffect } from "react";
import { SiteInspection, InspectionStatus } from "../../types/siteInspection";
import {
  loadSiteInspections,
  saveSiteInspections,
  deleteSiteInspection,
  downloadInspectionPdf,
  sendWhatsAppNotification
} from "../../utils/siteInspectionManager";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { InspectionDetailModal } from "./InspectionDetailModal";
import { InspectionEmailModal } from "./InspectionEmailModal";
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
  Mail
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
            if (!snapshot.empty) {
              const remote: SiteInspection[] = [];
              snapshot.forEach((d) => {
                const data = d.data() as SiteInspection;
                if (data && data.id) {
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

  const handleDelete = (id: string) => {
    const updated = deleteSiteInspection(id);
    setInspections(updated);
    triggerAppNotification("Inspection record deleted", "info");
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

  return (
    <div className="space-y-5 pb-20">
      {/* Top Filter & Actions Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>Admin Inspections Dashboard</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                {inspections.length} Total
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Review field submissions, download signed A4 PDFs & dispatch WhatsApp updates
            </p>
          </div>

          {onNewInspectionClick && (
            <button
              onClick={onNewInspectionClick}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ New Site Inspection</span>
            </button>
          )}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Owner, Ref No, Place, Phone, Survey No..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {["ALL", "submitted", "approved", "under_review", "action_required"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize shrink-0 transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-emerald-500 text-slate-950 font-bold"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {st === "ALL" ? "All Status" : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inspections Grid / List */}
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
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Fill Field Inspection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInspections.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-3.5 shadow-xl transition-all flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-emerald-400 font-mono font-bold border border-slate-800">
                      {item.inspectionNumber}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1 line-clamp-1">
                      {item.ownerName}
                    </h3>
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
                </div>

                {/* GPS Indicator & Media Counts */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                  {item.gps ? (
                    <span className="text-cyan-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      GPS Locked (±{item.gps.accuracy || 0}m)
                    </span>
                  ) : (
                    <span className="text-slate-500">No GPS Tag</span>
                  )}

                  {item.media && item.media.length > 0 && (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      {item.media.length} media
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedInspection(item);
                    setIsDetailModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Details</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEmailModalInspection(item)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    title="Send Email Report to Deepak Sir"
                  >
                    <Mail className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => downloadInspectionPdf(item)}
                    className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    title="Download A4 PDF Report"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => sendWhatsAppNotification(item)}
                    className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    title="Send WhatsApp Summary (+918848241463)"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete inspection ${item.inspectionNumber}?`)) {
                        handleDelete(item.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
        onDelete={handleDelete}
      />

      {/* Email Dispatch Modal */}
      <InspectionEmailModal
        isOpen={!!emailModalInspection}
        onClose={() => setEmailModalInspection(null)}
        inspection={emailModalInspection}
      />
    </div>
  );
};
