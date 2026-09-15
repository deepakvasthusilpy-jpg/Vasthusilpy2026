import React, { useState } from "react";
import { CrmProject, StaffName } from "../../../types";
import {
  History,
  Search,
  Filter,
  User,
  Calendar,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Receipt,
  Eye,
  ArrowRight
} from "lucide-react";

interface ProjectActivityHistoryViewProps {
  projects: CrmProject[];
  onSelectProject: (project: CrmProject) => void;
}

interface AggregatedActivity {
  id: string;
  actor: StaffName | "SYSTEM";
  action: string;
  timestamp: string;
  projectId: string;
  projectTitle: string;
  projectClient: string;
}

export const ProjectActivityHistoryView: React.FC<ProjectActivityHistoryViewProps> = ({
  projects,
  onSelectProject
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [staffFilter, setStaffFilter] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");

  // Aggregate all activities across all projects
  const allActivities: AggregatedActivity[] = projects.flatMap((p) =>
    (p.activities || []).map((act) => ({
      ...act,
      projectId: p.id,
      projectTitle: p.title,
      projectClient: p.clientName
    }))
  );

  // Sort by timestamp or reverse order (most recent first)
  const sortedActivities = [...allActivities].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Filter activities
  const filteredActivities = sortedActivities.filter((act) => {
    const matchesStaff = staffFilter === "ALL" || act.actor === staffFilter;
    const matchesProject = selectedProjectId === "ALL" || act.projectId === selectedProjectId;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      act.action.toLowerCase().includes(searchLower) ||
      act.actor.toLowerCase().includes(searchLower) ||
      act.projectTitle.toLowerCase().includes(searchLower) ||
      act.projectClient.toLowerCase().includes(searchLower) ||
      act.projectId.toLowerCase().includes(searchLower) ||
      act.timestamp.toLowerCase().includes(searchLower);

    return matchesStaff && matchesProject && matchesSearch;
  });

  // Helper for actor badge styling
  const getActorBadgeStyle = (actor: string) => {
    switch (actor) {
      case "DEEPAK":
        return "bg-emerald-950 text-emerald-400 border-emerald-800";
      case "VISHNU":
        return "bg-cyan-950 text-cyan-400 border-cyan-800";
      case "DIBIN":
        return "bg-purple-950 text-purple-400 border-purple-800";
      case "SYSTEM":
        return "bg-amber-950 text-amber-400 border-amber-800";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total History Logs</div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {allActivities.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">Recorded Actions</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Projects</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">
              {projects.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">Tracked in History</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Staff Members</div>
            <div className="text-xl font-black font-mono text-purple-400 mt-1">
              3
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">DEEPAK, VISHNU, DIBIN</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/80 text-purple-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Filtered Results</div>
            <div className="text-xl font-black font-mono text-amber-400 mt-1">
              {filteredActivities.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">Displaying Items</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity by action, staff, project title, or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Staff Filter */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <span className="text-[11px] text-slate-500 font-bold mr-1">STAFF:</span>
          {(["ALL", "DEEPAK", "VISHNU", "DIBIN", "SYSTEM"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStaffFilter(st)}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer border font-bold ${
                staffFilter === st
                  ? "bg-slate-800 text-white border-slate-600"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title.length > 28 ? p.title.substring(0, 28) + "..." : p.title} (#{p.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Timeline List */}
      {filteredActivities.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <History className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Activity History Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || staffFilter !== "ALL" || selectedProjectId !== "ALL"
              ? "No activity logs match your current search or staff filter."
              : "No project activities recorded yet."}
          </p>
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white font-sans uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Project Previous History Log ({filteredActivities.length})</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Chronological Order</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {filteredActivities.map((act) => {
              const matchedProj = projects.find((p) => p.id === act.projectId);

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-emerald-500 group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase ${getActorBadgeStyle(act.actor)}`}>
                          👤 {act.actor}
                        </span>
                        <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                          #{act.projectId}
                        </span>
                        <span className="text-[11px] font-bold text-slate-200">
                          {act.projectTitle}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{act.timestamp}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-200 font-sans leading-relaxed pl-1">
                      {act.action}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400">
                        Client: <strong className="text-slate-300">{act.projectClient}</strong>
                      </span>

                      {matchedProj && (
                        <button
                          onClick={() => onSelectProject(matchedProj)}
                          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>View Project Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
