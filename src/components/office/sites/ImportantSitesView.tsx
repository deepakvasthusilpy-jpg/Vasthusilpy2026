import React, { useState, useEffect, useRef } from "react";
import { ImportantSite, SiteFolder } from "../../../types";
import {
  loadImportantSites,
  saveImportantSites,
  deleteImportantSite,
  loadSiteFolders,
  saveSiteFolders,
  createSiteFolder,
  renameSiteFolder,
  deleteSiteFolder,
  getDeletedSiteIds,
  exportSitesVaultJson,
  DEMO_SITE_IDS
} from "../../../utils/importantSitesManager";
import { db } from "../../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { NewEditSiteModal } from "./NewEditSiteModal";
import { NewEditFolderModal } from "./NewEditFolderModal";
import { DeleteSiteModal } from "./DeleteSiteModal";
import { DeleteFolderModal } from "./DeleteFolderModal";
import { AutoLoginHelperModal } from "./AutoLoginHelperModal";
import { triggerAppNotification } from "../../../context/NotificationContext";
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Star,
  Edit2,
  Trash2,
  Download,
  LayoutGrid,
  List,
  Folder,
  FolderPlus,
  FolderOpen,
  X,
  Save,
  ChevronRight,
  FolderKanban,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight
} from "lucide-react";

export const ImportantSitesView: React.FC = () => {
  const [sites, setSites] = useState<ImportantSite[]>(() => loadImportantSites());
  const [folders, setFolders] = useState<SiteFolder[]>(() => loadSiteFolders());
  const [selectedFolder, setSelectedFolder] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isDirectEditMode, setIsDirectEditMode] = useState(false);
  const [showFolderDirectory, setShowFolderDirectory] = useState(true);

  // Modals state
  const [isNewEditSiteModalOpen, setIsNewEditSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<ImportantSite | null>(null);
  const [defaultModalFolder, setDefaultModalFolder] = useState<string>("VEO");
  const [isNewEditFolderModalOpen, setIsNewEditFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<SiteFolder | null>(null);
  const [isDeleteSiteModalOpen, setIsDeleteSiteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<ImportantSite | null>(null);
  const [isDeleteFolderModalOpen, setIsDeleteFolderModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<SiteFolder | null>(null);
  const [isAutoLoginModalOpen, setIsAutoLoginModalOpen] = useState(false);
  const [selectedHelperSite, setSelectedHelperSite] = useState<ImportantSite | null>(null);

  // In-line direct editing state per card
  const [inlineEditingSiteId, setInlineEditingSiteId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<Partial<ImportantSite>>({});

  // Password visibility & Copy feedback states
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null);

  // Real-Time Sync & Storage Listeners
  useEffect(() => {
    let isMounted = true;
    let unsubSites = () => {};
    let unsubFolders = () => {};

    if (db) {
      try {
        unsubSites = onSnapshot(
          collection(db, "important_sites"),
          (snapshot) => {
            if (!isMounted) return;
            const deletedIds = getDeletedSiteIds();
            if (!snapshot.empty) {
              const remoteSites: ImportantSite[] = [];
              snapshot.forEach((d) => {
                const data = d.data() as ImportantSite;
                if (data && data.id && !deletedIds.includes(data.id) && !DEMO_SITE_IDS.includes(data.id)) {
                  remoteSites.push(data);
                }
              });

              setSites((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(remoteSites)) return prev;
                return remoteSites;
              });
              saveImportantSites(remoteSites, false);
            }
          },
          () => {}
        );

        unsubFolders = onSnapshot(
          collection(db, "site_folders"),
          (snapshot) => {
            if (!isMounted) return;
            if (!snapshot.empty) {
              const remoteFolders: SiteFolder[] = [];
              snapshot.forEach((d) => {
                const data = d.data() as SiteFolder;
                if (data && data.name) {
                  remoteFolders.push(data);
                }
              });
              setFolders((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(remoteFolders)) return prev;
                return remoteFolders;
              });
              saveSiteFolders(remoteFolders, false);
            }
          },
          () => {}
        );
      } catch (e) {
        // Safe offline fallback
      }
    }

    const handleStorageUpdate = () => {
      setSites(loadImportantSites());
      setFolders(loadSiteFolders());
    };
    window.addEventListener("vasthusilpy_important_sites_updated", handleStorageUpdate);
    window.addEventListener("vasthusilpy_site_folders_updated", handleStorageUpdate);

    return () => {
      isMounted = false;
      unsubSites();
      unsubFolders();
      window.removeEventListener("vasthusilpy_important_sites_updated", handleStorageUpdate);
      window.removeEventListener("vasthusilpy_site_folders_updated", handleStorageUpdate);
    };
  }, []);

  const handleTogglePassword = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, field: "username" | "password" | "pin" | "url", textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedField({ id, field });
    setTimeout(() => {
      setCopiedField((prev) => (prev?.id === id && prev?.field === field ? null : prev));
    }, 2000);
  };

  const handleOpenSite = (site: ImportantSite) => {
    const targetUrl = site.url.startsWith("http") ? site.url : `https://${site.url}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");

    const now = new Date().toISOString();
    const updated = sites.map((s) => (s.id === site.id ? { ...s, lastOpenedAt: now } : s));
    setSites(updated);
    saveImportantSites(updated);
  };

  const handleToggleFavorite = (site: ImportantSite) => {
    const updated = sites.map((s) =>
      s.id === site.id ? { ...s, isFavorite: !s.isFavorite, updatedAt: new Date().toISOString() } : s
    );
    setSites(updated);
    saveImportantSites(updated);
  };

  // Folder Operations
  const handleSaveFolder = (folderData: { id?: string; name: string; color: string; description?: string }) => {
    if (folderData.id) {
      renameSiteFolder(folderData.id, folderData.name, folderData.color);
    } else {
      createSiteFolder(folderData.name, folderData.color, folderData.description);
    }
    setFolders(loadSiteFolders());
    setSites(loadImportantSites());
    triggerAppNotification(
      folderData.id ? `Folder "${folderData.name}" updated` : `Folder "${folderData.name}" created`,
      "success"
    );
  };

  const handleDeleteFolderConfirm = () => {
    if (!folderToDelete) return;
    deleteSiteFolder(folderToDelete.id);
    if (selectedFolder === folderToDelete.name) {
      setSelectedFolder("ALL");
    }
    setFolders(loadSiteFolders());
    setSites(loadImportantSites());
    triggerAppNotification(`Folder "${folderToDelete.name}" deleted`, "info");
    setFolderToDelete(null);
  };

  // Site Save & Delete
  const handleSaveSite = (site: ImportantSite) => {
    const existingIndex = sites.findIndex((s) => s.id === site.id);
    let updated: ImportantSite[];
    if (existingIndex >= 0) {
      updated = sites.map((s) => (s.id === site.id ? site : s));
    } else {
      updated = [site, ...sites];
    }
    setSites(updated);
    saveImportantSites(updated);
    triggerAppNotification(`Website "${site.name}" saved successfully`, "success");
  };

  const handleDeleteSiteConfirm = () => {
    if (!siteToDelete) return;
    const remaining = deleteImportantSite(siteToDelete.id);
    setSites(remaining);
    triggerAppNotification(`Website "${siteToDelete.name}" removed`, "info");
    setSiteToDelete(null);
  };

  // Direct In-line Edit Handler
  const cancelInlineEdit = () => {
    setInlineEditingSiteId(null);
    setInlineForm({});
  };

  const saveInlineEdit = (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;

    let cleanUrl = (inlineForm.url || site.url || "").trim();
    if (cleanUrl && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    const updatedSite: ImportantSite = {
      ...site,
      name: (inlineForm.name || site.name).trim(),
      url: cleanUrl,
      folder: (inlineForm.folder || site.folder || "General").trim(),
      customCategory: (inlineForm.folder || site.folder || "General").trim(),
      username: (inlineForm.username ?? site.username ?? "").trim(),
      password: inlineForm.password ?? site.password ?? "",
      notes: (inlineForm.notes ?? site.notes ?? "").trim(),
      color: inlineForm.color || site.color || "emerald",
      updatedAt: new Date().toISOString()
    };

    const updated = sites.map((s) => (s.id === siteId ? updatedSite : s));
    setSites(updated);
    saveImportantSites(updated);
    setInlineEditingSiteId(null);
    setInlineForm({});
    triggerAppNotification(`Updated "${updatedSite.name}"`, "success");
  };

  // Quick Open Modal with Specific Folder
  const openNewSiteModalWithFolder = (folderName: string) => {
    setEditingSite(null);
    setDefaultModalFolder(folderName);
    setIsNewEditSiteModalOpen(true);
  };

  // Filtered Sites
  const filteredSites = sites.filter((site) => {
    const folderMatch =
      selectedFolder === "ALL"
        ? true
        : selectedFolder === "FAVORITES"
        ? !!site.isFavorite
        : (site.folder || site.customCategory || "General").toLowerCase() === selectedFolder.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    const searchMatch =
      !q ||
      site.name.toLowerCase().includes(q) ||
      site.url.toLowerCase().includes(q) ||
      (site.username && site.username.toLowerCase().includes(q)) ||
      (site.notes && site.notes.toLowerCase().includes(q)) ||
      (site.folder && site.folder.toLowerCase().includes(q));

    return folderMatch && searchMatch;
  });

  const getFolderSiteCount = (folderName: string) => {
    return sites.filter(
      (s) => (s.folder || s.customCategory || "General").toLowerCase() === folderName.toLowerCase()
    ).length;
  };

  const getFolderSites = (folderName: string) => {
    return sites.filter(
      (s) => (s.folder || s.customCategory || "General").toLowerCase() === folderName.toLowerCase()
    );
  };

  // Color helper
  const getColorClasses = (colorName = "emerald") => {
    switch (colorName) {
      case "emerald":
        return {
          bg: "bg-emerald-500/15",
          text: "text-emerald-400",
          border: "border-emerald-500/30",
          badgeBg: "bg-emerald-500/20",
          badgeText: "text-emerald-300",
          ring: "ring-emerald-400"
        };
      case "cyan":
        return {
          bg: "bg-cyan-500/15",
          text: "text-cyan-400",
          border: "border-cyan-500/30",
          badgeBg: "bg-cyan-500/20",
          badgeText: "text-cyan-300",
          ring: "ring-cyan-400"
        };
      case "blue":
        return {
          bg: "bg-blue-500/15",
          text: "text-blue-400",
          border: "border-blue-500/30",
          badgeBg: "bg-blue-500/20",
          badgeText: "text-blue-300",
          ring: "ring-blue-400"
        };
      case "indigo":
        return {
          bg: "bg-indigo-500/15",
          text: "text-indigo-400",
          border: "border-indigo-500/30",
          badgeBg: "bg-indigo-500/20",
          badgeText: "text-indigo-300",
          ring: "ring-indigo-400"
        };
      case "purple":
        return {
          bg: "bg-purple-500/15",
          text: "text-purple-400",
          border: "border-purple-500/30",
          badgeBg: "bg-purple-500/20",
          badgeText: "text-purple-300",
          ring: "ring-purple-400"
        };
      case "amber":
        return {
          bg: "bg-amber-500/15",
          text: "text-amber-400",
          border: "border-amber-500/30",
          badgeBg: "bg-amber-500/20",
          badgeText: "text-amber-300",
          ring: "ring-amber-400"
        };
      case "rose":
        return {
          bg: "bg-rose-500/15",
          text: "text-rose-400",
          border: "border-rose-500/30",
          badgeBg: "bg-rose-500/20",
          badgeText: "text-rose-300",
          ring: "ring-rose-400"
        };
      case "teal":
        return {
          bg: "bg-teal-500/15",
          text: "text-teal-400",
          border: "border-teal-500/30",
          badgeBg: "bg-teal-500/20",
          badgeText: "text-teal-300",
          ring: "ring-teal-400"
        };
      default:
        return {
          bg: "bg-emerald-500/15",
          text: "text-emerald-400",
          border: "border-emerald-500/30",
          badgeBg: "bg-emerald-500/20",
          badgeText: "text-emerald-300",
          ring: "ring-emerald-400"
        };
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. TOP HEADER & MAIN CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
                <Globe className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                  <span>Important Sites</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono uppercase font-bold">
                    Vault & Folders
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  Organize government portals, service links, VEO forms & login credentials by folders
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Edit Mode Toggle */}
            <button
              onClick={() => setIsDirectEditMode(!isDirectEditMode)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isDirectEditMode
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-white/40"
                  : "bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700"
              }`}
              title="Toggle Direct Edit mode on cards"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isDirectEditMode ? "Direct Edit: ON" : "Direct Edit"}</span>
            </button>

            {/* Toggle Folder Directory Section */}
            <button
              onClick={() => setShowFolderDirectory(!showFolderDirectory)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                showFolderDirectory
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                  : "bg-slate-850 text-slate-400 hover:text-white border border-slate-700"
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 text-teal-400" />
              <span>{showFolderDirectory ? "Hide Folder List" : "Show All Folders"}</span>
            </button>

            {/* New Folder Button */}
            <button
              onClick={() => {
                setEditingFolder(null);
                setIsNewEditFolderModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Create a new folder (e.g. VEO, Taxes, Survey)"
            >
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              <span>+ New Folder</span>
            </button>

            {/* Add Website Link Button */}
            <button
              onClick={() => {
                setEditingSite(null);
                setDefaultModalFolder(selectedFolder !== "ALL" && selectedFolder !== "FAVORITES" ? selectedFolder : "VEO");
                setIsNewEditSiteModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Website Link</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={() => exportSitesVaultJson(sites, folders)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-2xl transition cursor-pointer"
              title="Backup / Export Sites & Folders JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. ALL FOLDERS DIRECTORY LIST ON DASHBOARD */}
      {showFolderDirectory && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <span>All Folders Directory</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 font-mono font-bold">
                    {folders.length} Folders
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  Click any folder to filter websites or manage links inside it
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingFolder(null);
                setIsNewEditFolderModalOpen(true);
              }}
              className="self-start sm:self-auto px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Create Folder</span>
            </button>
          </div>

          {/* FOLDERS GRID LIST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {folders.map((f) => {
              const isSelected = selectedFolder.toLowerCase() === f.name.toLowerCase();
              const siteCount = getFolderSiteCount(f.name);
              const folderSitesList = getFolderSites(f.name);
              const colorClass = getColorClasses(f.color);

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFolder(f.name)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                    isSelected
                      ? "bg-slate-850 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/10"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  {/* Folder Header */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl ${colorClass.bg} ${colorClass.text} border ${colorClass.border} flex items-center justify-center shrink-0 font-bold shadow`}
                        >
                          <Folder className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition flex items-center gap-1.5">
                            <span>{f.name}</span>
                            {f.name.toLowerCase() === "veo" && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                                ACTIVE
                              </span>
                            )}
                          </h3>
                          <span className="text-[11px] text-slate-400 font-mono">
                            <strong className="text-emerald-400">{siteCount}</strong> site(s) saved
                          </span>
                        </div>
                      </div>

                      {/* Folder Card Actions */}
                      <div
                        className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditingFolder(f);
                            setIsNewEditFolderModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                          title="Rename / Edit Folder"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setFolderToDelete(f);
                            setIsDeleteFolderModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete Folder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description or preview snippet */}
                    {f.description ? (
                      <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                        {f.description}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500 font-mono">
                        {siteCount === 0 ? "No websites in this folder yet" : "Click to view links"}
                      </p>
                    )}

                    {/* Quick site tags in this folder */}
                    {folderSitesList.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {folderSitesList.slice(0, 3).map((s) => (
                          <span
                            key={s.id}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono truncate max-w-[120px]"
                            title={s.name}
                          >
                            {s.name}
                          </span>
                        ))}
                        {folderSitesList.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-slate-900 text-slate-400 font-mono">
                            +{folderSitesList.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Bar inside card */}
                  <div
                    className="pt-3 mt-3 border-t border-slate-850 flex items-center justify-between text-[11px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openNewSiteModalWithFolder(f.name)}
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Site Link</span>
                    </button>

                    <button
                      onClick={() => setSelectedFolder(f.name)}
                      className={`font-semibold flex items-center gap-0.5 transition cursor-pointer ${
                        isSelected ? "text-emerald-300 font-bold" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{isSelected ? "Active" : "Open"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. FOLDER NAVIGATION TABS & SEARCH BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, link, folder, username or notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Toggle & Total Count */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-400 font-mono">
              Showing <strong className="text-emerald-400">{filteredSites.length}</strong> link(s)
            </span>
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "grid" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "table" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
                title="Table List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* FOLDERS FILTER TABS */}
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* ALL SITES FOLDER */}
          <button
            onClick={() => setSelectedFolder("ALL")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
              selectedFolder === "ALL"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>All Sites</span>
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-bold ${
                selectedFolder === "ALL" ? "bg-slate-950/30 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}
            >
              {sites.length}
            </span>
          </button>

          {/* FAVORITES */}
          <button
            onClick={() => setSelectedFolder("FAVORITES")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition cursor-pointer ${
              selectedFolder === "FAVORITES"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${selectedFolder === "FAVORITES" ? "fill-slate-950" : "text-amber-400"}`} />
            <span>Favorites</span>
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-bold ${
                selectedFolder === "FAVORITES" ? "bg-slate-950/30 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}
            >
              {sites.filter((s) => s.isFavorite).length}
            </span>
          </button>

          {/* INDIVIDUAL CUSTOM FOLDERS (VEO, General, etc.) */}
          {folders.map((f) => {
            const isSelected = selectedFolder.toLowerCase() === f.name.toLowerCase();
            const count = getFolderSiteCount(f.name);
            const colorClass = getColorClasses(f.color);

            return (
              <div key={f.id} className="relative group shrink-0 flex items-center">
                <button
                  onClick={() => setSelectedFolder(f.name)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                      : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <Folder className={`w-3.5 h-3.5 ${isSelected ? "text-slate-950" : colorClass.text}`} />
                  <span>{f.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? "bg-slate-950/30 text-slate-950" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              </div>
            );
          })}

          {/* ADD FOLDER BUTTON */}
          <button
            onClick={() => {
              setEditingFolder(null);
              setIsNewEditFolderModalOpen(true);
            }}
            className="px-3 py-2 rounded-2xl text-xs font-semibold shrink-0 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-dashed border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Folder</span>
          </button>
        </div>
      </div>

      {/* 4. SITES DISPLAY (GRID OR TABLE) */}
      {filteredSites.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No websites found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? `No links matched "${searchQuery}". Try another keyword.`
                : selectedFolder !== "ALL"
                ? `No website links saved under the "${selectedFolder}" folder yet.`
                : "No important sites saved yet. Add your first link!"}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setEditingSite(null);
                setDefaultModalFolder(selectedFolder !== "ALL" && selectedFolder !== "FAVORITES" ? selectedFolder : "VEO");
                setIsNewEditSiteModalOpen(true);
              }}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>
                Add Website Link {selectedFolder !== "ALL" && selectedFolder !== "FAVORITES" ? `to ${selectedFolder}` : ""}
              </span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSites.map((site) => {
            const isInlineEditing = inlineEditingSiteId === site.id || isDirectEditMode;
            const colorClass = getColorClasses(site.color);

            return (
              <div
                key={site.id}
                className={`bg-slate-900 border ${
                  isInlineEditing ? "border-emerald-500 ring-1 ring-emerald-500/50" : "border-slate-800 hover:border-slate-700"
                } rounded-3xl p-5 space-y-4 shadow-xl transition-all relative flex flex-col justify-between`}
              >
                {/* Card Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl ${colorClass.bg} ${colorClass.text} border ${colorClass.border} flex items-center justify-center font-bold text-sm shadow-md shrink-0`}
                      >
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {isInlineEditing ? (
                          <input
                            type="text"
                            value={inlineForm.name !== undefined ? inlineForm.name : site.name}
                            onChange={(e) => setInlineForm({ ...inlineForm, name: e.target.value })}
                            className="bg-slate-950 border border-emerald-500 rounded-xl px-2.5 py-1 text-sm font-bold text-white w-full focus:outline-none"
                            placeholder="Website Title"
                          />
                        ) : (
                          <h4 className="text-sm font-bold text-white truncate hover:text-emerald-400 transition">
                            {site.name}
                          </h4>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-lg ${colorClass.bg} ${colorClass.text} border ${colorClass.border} font-bold font-mono flex items-center gap-1`}
                          >
                            <Folder className="w-2.5 h-2.5" />
                            <span>{site.folder || site.customCategory || "General"}</span>
                          </span>
                          {site.isFavorite && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pin / Direct Edit / Modal Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleFavorite(site)}
                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                          site.isFavorite ? "text-amber-400 bg-amber-500/10" : "text-slate-500 hover:text-white bg-slate-950"
                        }`}
                        title={site.isFavorite ? "Unpin Favorite" : "Pin to Favorites"}
                      >
                        <Star className={`w-3.5 h-3.5 ${site.isFavorite ? "fill-amber-400" : ""}`} />
                      </button>

                      <button
                        onClick={() => {
                          setEditingSite(site);
                          setIsNewEditSiteModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                        title="Edit Website Link & Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setSiteToDelete(site);
                          setIsDeleteSiteModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title="Delete Website Link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* URL Display / Direct Input */}
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono font-semibold flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-cyan-400" />
                        URL Link
                      </span>
                      <button
                        onClick={() => handleCopy(site.id, "url", site.url)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                        title="Copy Website Link"
                      >
                        {copiedField?.id === site.id && copiedField?.field === "url" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={inlineForm.url !== undefined ? inlineForm.url : site.url}
                        onChange={(e) => setInlineForm({ ...inlineForm, url: e.target.value })}
                        className="bg-slate-900 border border-cyan-500/60 rounded-xl px-2.5 py-1 text-xs text-cyan-300 font-mono w-full focus:outline-none"
                        placeholder="https://..."
                      />
                    ) : (
                      <p className="text-xs text-cyan-300 font-mono truncate select-all">{site.url}</p>
                    )}
                  </div>

                  {/* Credentials / Details if present */}
                  {(site.username || site.password || isInlineEditing) && (
                    <div className="p-2.5 bg-slate-950/80 border border-slate-850 rounded-2xl space-y-2 text-xs">
                      {/* Username */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 font-mono">User ID:</span>
                        {isInlineEditing ? (
                          <input
                            type="text"
                            value={inlineForm.username !== undefined ? inlineForm.username : site.username}
                            onChange={(e) => setInlineForm({ ...inlineForm, username: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white w-36 focus:outline-none"
                            placeholder="Username"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs text-slate-200 font-mono truncate font-semibold">
                              {site.username || "—"}
                            </span>
                            {site.username && (
                              <button
                                onClick={() => handleCopy(site.id, "username", site.username)}
                                className="text-slate-400 hover:text-white"
                                title="Copy Username"
                              >
                                {copiedField?.id === site.id && copiedField?.field === "username" ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Password */}
                      {(site.password || isInlineEditing) && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400 font-mono">Password:</span>
                          {isInlineEditing ? (
                            <input
                              type="password"
                              value={inlineForm.password !== undefined ? inlineForm.password : site.password}
                              onChange={(e) => setInlineForm({ ...inlineForm, password: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-amber-300 font-mono w-36 focus:outline-none"
                              placeholder="Password"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-amber-300 font-mono font-bold">
                                {visiblePasswords[site.id] ? site.password : "••••••••••••"}
                              </span>
                              <button
                                onClick={() => handleTogglePassword(site.id)}
                                className="text-slate-400 hover:text-white"
                                title={visiblePasswords[site.id] ? "Hide" : "Show"}
                              >
                                {visiblePasswords[site.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              {site.password && (
                                <button
                                  onClick={() => handleCopy(site.id, "password", site.password!)}
                                  className="text-slate-400 hover:text-white"
                                  title="Copy Password"
                                >
                                  {copiedField?.id === site.id && copiedField?.field === "password" ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {site.notes && !isInlineEditing && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic px-1">
                      "{site.notes}"
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {isInlineEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => saveInlineEdit(site.id)}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                      <button
                        onClick={cancelInlineEdit}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {site.lastOpenedAt
                          ? `Opened ${new Date(site.lastOpenedAt).toLocaleDateString()}`
                          : "Ready to launch"}
                      </span>

                      <button
                        onClick={() => handleOpenSite(site)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        <span>Open Site</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Website / Form Name</th>
                  <th className="py-3.5 px-4">Folder</th>
                  <th className="py-3.5 px-4">URL Link</th>
                  <th className="py-3.5 px-4">Credentials</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSites.map((site) => {
                  const colorClass = getColorClasses(site.color);

                  return (
                    <tr key={site.id} className="hover:bg-slate-850/60 transition group">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                        <button
                          onClick={() => handleToggleFavorite(site)}
                          className="text-slate-500 hover:text-amber-400 cursor-pointer"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              site.isFavorite ? "text-amber-400 fill-amber-400" : ""
                            }`}
                          />
                        </button>
                        <div
                          className={`w-7 h-7 rounded-xl ${colorClass.bg} ${colorClass.text} border ${colorClass.border} flex items-center justify-center font-bold text-xs shrink-0`}
                        >
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="truncate max-w-xs">{site.name}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-lg ${colorClass.bg} ${colorClass.text} border ${colorClass.border} font-bold font-mono inline-flex items-center gap-1`}
                        >
                          <Folder className="w-2.5 h-2.5" />
                          <span>{site.folder || site.customCategory || "General"}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-cyan-300 max-w-xs truncate select-all">
                        {site.url}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {site.username ? (
                          <div className="flex items-center gap-2">
                            <span>{site.username}</span>
                            <button
                              onClick={() => handleCopy(site.id, "username", site.username)}
                              className="text-slate-500 hover:text-white"
                              title="Copy Username"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenSite(site)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingSite(site);
                              setIsNewEditSiteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-950 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSiteToDelete(site);
                              setIsDeleteSiteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Add / Edit Site Modal */}
      <NewEditSiteModal
        isOpen={isNewEditSiteModalOpen}
        onClose={() => setIsNewEditSiteModalOpen(false)}
        onSave={handleSaveSite}
        siteToEdit={editingSite}
        defaultFolder={defaultModalFolder}
        folders={folders}
        onAddNewFolder={(folderName) => {
          createSiteFolder(folderName);
          setFolders(loadSiteFolders());
        }}
      />

      {/* 2. Add / Edit Folder Modal */}
      <NewEditFolderModal
        isOpen={isNewEditFolderModalOpen}
        onClose={() => setIsNewEditFolderModalOpen(false)}
        onSave={handleSaveFolder}
        folderToEdit={editingFolder}
      />

      {/* 3. Delete Site Modal */}
      <DeleteSiteModal
        isOpen={isDeleteSiteModalOpen}
        onClose={() => setIsDeleteSiteModalOpen(false)}
        onConfirm={handleDeleteSiteConfirm}
        site={siteToDelete}
      />

      {/* 4. Delete Folder Modal */}
      <DeleteFolderModal
        isOpen={isDeleteFolderModalOpen}
        onClose={() => setIsDeleteFolderModalOpen(false)}
        onConfirm={handleDeleteFolderConfirm}
        folder={folderToDelete}
        siteCount={folderToDelete ? getFolderSiteCount(folderToDelete.name) : 0}
      />

      {/* 5. Auto Login Helper Modal */}
      {selectedHelperSite && (
        <AutoLoginHelperModal
          isOpen={isAutoLoginModalOpen}
          onClose={() => {
            setIsAutoLoginModalOpen(false);
            setSelectedHelperSite(null);
          }}
          site={selectedHelperSite}
        />
      )}
    </div>
  );
};
