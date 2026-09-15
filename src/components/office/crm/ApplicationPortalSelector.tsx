import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Check,
  Layers,
  Sparkles,
  Trash2,
  ChevronDown,
  IndianRupee
} from "lucide-react";
import {
  StoredPortalOption,
  loadStoredPortals,
  addStoredPortal,
  deleteStoredPortal
} from "../../../utils/onlineApplicationsManager";
import { loadApplicationTypes } from "../../../data/applicationTypesData";

interface ApplicationPortalSelectorProps {
  value: string;
  onChange: (portalName: string, portalUrl?: string) => void;
  placeholder?: string;
  className?: string;
}

export const ApplicationPortalSelector: React.FC<ApplicationPortalSelectorProps> = ({
  value,
  onChange,
  placeholder = "Type application name (e.g. POSSESSION CERTIFICATE)...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [portals, setPortals] = useState<StoredPortalOption[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshList = () => {
    // Combine configured application types and stored portals
    const appTypes = loadApplicationTypes();
    const map = new Map<string, StoredPortalOption>();

    appTypes.forEach((t) => {
      map.set(t.name.toLowerCase().trim(), {
        name: t.name,
        url: "",
        category: `${t.fee} Rs • ${t.userId || "USER ID"}`
      });
    });

    const stored = loadStoredPortals();
    stored.forEach((p) => {
      if (!map.has(p.name.toLowerCase().trim())) {
        map.set(p.name.toLowerCase().trim(), p);
      }
    });

    setPortals(Array.from(map.values()));
  };

  useEffect(() => {
    refreshList();
    const handleChanged = () => refreshList();
    window.addEventListener("vasthusilpy_application_types_changed", handleChanged);
    return () => window.removeEventListener("vasthusilpy_application_types_changed", handleChanged);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (portal: StoredPortalOption) => {
    onChange(portal.name, portal.url);
    setIsOpen(false);
  };

  const handleManualType = (text: string) => {
    onChange(text);
    setSearchFilter(text);
  };

  const handleSaveCustomPortal = (nameToSave: string) => {
    const trimmed = nameToSave.trim().toUpperCase();
    if (!trimmed) return;
    const updated = addStoredPortal(trimmed);
    setPortals(updated);
    onChange(trimmed);
    setIsOpen(false);
  };

  const handleDeletePortal = (e: React.MouseEvent, portalName: string) => {
    e.stopPropagation();
    const updated = deleteStoredPortal(portalName);
    setPortals(updated);
  };

  const query = searchFilter.trim().toLowerCase();
  const filteredPortals = portals.filter((p) => {
    return query === "" || p.name.toLowerCase().includes(query) || (p.category && p.category.toLowerCase().includes(query));
  });

  // Quick chips: configured application types or top items
  const quickPicks = portals.slice(0, 5);
  const isExactMatch = portals.some((p) => p.name.toLowerCase() === (value || "").trim().toLowerCase());

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
      {/* Manual Input field & dropdown toggle */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => handleManualType(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3.5 pr-9 py-2.5 text-sm sm:text-base font-bold text-white uppercase placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors tracking-wide"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2.5 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Browse Application Types"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Quick Select Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mr-0.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Select:
        </span>
        {quickPicks.map((qp) => {
          const isSelected = value?.toLowerCase() === qp.name.toLowerCase();
          return (
            <button
              key={qp.name}
              type="button"
              onClick={() => handleSelect(qp)}
              className={`text-xs font-mono px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                isSelected
                  ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30 font-black"
                  : "bg-slate-950/80 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 hover:border-cyan-500"
              }`}
            >
              {qp.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[9px] font-mono text-slate-400 hover:text-white underline px-1 cursor-pointer"
        >
          {isOpen ? "Close List" : "More..."}
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-2xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
              <Layers className="w-3.5 h-3.5" />
              <span>Select Application Type</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {portals.length} application types
            </span>
          </div>

          {/* Search Box inside dropdown */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search application types..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* If user typed a custom name that doesn't exist */}
          {value.trim() && !isExactMatch && (
            <div className="bg-cyan-950/40 border border-cyan-800/80 rounded-xl p-2 flex items-center justify-between gap-2">
              <div className="text-xs font-mono">
                <span className="text-slate-400 text-[10px] block">New Application:</span>
                <span className="font-bold text-cyan-300 truncate block">"{value.trim().toUpperCase()}"</span>
              </div>
              <button
                type="button"
                onClick={() => handleSaveCustomPortal(value)}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow"
              >
                <Plus className="w-3 h-3" />
                <span>Save Application</span>
              </button>
            </div>
          )}

          {/* Scrollable List */}
          <div className="max-h-52 overflow-y-auto pr-1 space-y-1">
            {filteredPortals.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs font-mono">
                No matching applications. Click "Save Application" to add "{searchFilter}".
              </div>
            ) : (
              filteredPortals.map((portal) => {
                const isSelected = value?.toLowerCase() === portal.name.toLowerCase();

                return (
                  <div
                    key={portal.name}
                    onClick={() => handleSelect(portal)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-mono cursor-pointer transition-colors group ${
                      isSelected
                        ? "bg-cyan-950/80 border border-cyan-500 text-white font-bold"
                        : "bg-slate-900/70 hover:bg-slate-850 text-slate-200 border border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isSelected ? "bg-cyan-400" : "bg-slate-600 group-hover:bg-cyan-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <span className="block truncate font-bold text-sm text-white group-hover:text-cyan-300 uppercase tracking-wide">
                          {portal.name}
                        </span>
                        {portal.category && (
                          <span className="text-[10px] text-emerald-400 block font-mono">
                            {portal.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePortal(e, portal.name)}
                          className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete from saved list"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
