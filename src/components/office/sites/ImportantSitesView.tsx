import React, { useState, useEffect, useRef } from "react";
import { ImportantSite, ImportantSiteCategory } from "../../../types";
import {
  loadImportantSites,
  saveImportantSites,
  deleteImportantSite,
  getDeletedSiteIds,
  exportSitesVaultJson,
  getMasterPin,
  setMasterPin,
  isVaultLocked,
  setVaultLockedState,
  DEMO_SITE_IDS
} from "../../../utils/importantSitesManager";
import { db } from "../../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { NewEditSiteModal } from "./NewEditSiteModal";
import { AutoLoginHelperModal } from "./AutoLoginHelperModal";
import { DeleteSiteModal } from "./DeleteSiteModal";
import { triggerAppNotification } from "../../../context/NotificationContext";
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Lock,
  Unlock,
  KeyRound,
  Copy,
  Check,
  Star,
  Zap,
  Edit2,
  Trash2,
  Download,
  Upload,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Sparkles,
  HelpCircle,
  Clock,
  Bookmark,
  FileText,
  User,
  Layers,
  Filter
} from "lucide-react";

export const ImportantSitesView: React.FC = () => {
  const [sites, setSites] = useState<ImportantSite[]>(() => loadImportantSites());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | ImportantSiteCategory | "FAVORITES">("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals state
  const [isNewEditModalOpen, setIsNewEditModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<ImportantSite | null>(null);
  const [isAutoLoginModalOpen, setIsAutoLoginModalOpen] = useState(false);
  const [selectedHelperSite, setSelectedHelperSite] = useState<ImportantSite | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<ImportantSite | null>(null);

  // Password visibility & Copy feedback states
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null);
  const [launchToast, setLaunchToast] = useState<{ siteName: string; text: string } | null>(null);

  // Vault PIN Lock state
  const [isLocked, setIsLocked] = useState<boolean>(() => isVaultLocked());
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-Time & Storage Listener: Sync Important Sites across all devices
  useEffect(() => {
    let isMounted = true;
    let unsub = () => {};

    if (db) {
      try {
        unsub = onSnapshot(
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
          () => {
            // Offline fallback
          }
        );
      } catch (e) {
        // Safe offline fallback
      }
    }

    const handleStorageUpdate = () => {
      setSites(loadImportantSites());
    };
    window.addEventListener("vasthusilpy_important_sites_updated", handleStorageUpdate);

    return () => {
      isMounted = false;
      unsub();
      window.removeEventListener("vasthusilpy_important_sites_updated", handleStorageUpdate);
    };
  }, []);

  const handleTogglePassword = (id: string) => {
    if (isLocked) {
      setShowPinPrompt(true);
      return;
    }
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

  const handleOpenAndAutoCopy = (site: ImportantSite) => {
    // 1. Copy password or credentials
    if (site.password) {
      navigator.clipboard.writeText(site.password);
    } else if (site.username) {
      navigator.clipboard.writeText(site.username);
    }

    // 2. Open portal URL
    const targetUrl = site.url.startsWith("http") ? site.url : `https://${site.url}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");

    // 3. Update last opened timestamp
    const now = new Date().toISOString();
    const updated = sites.map((s) => (s.id === site.id ? { ...s, lastOpenedAt: now } : s));
    setSites(updated);
    saveImportantSites(updated);

    // 4. Show friendly launch toast feedback
    setLaunchToast({
      siteName: site.name,
      text: site.password
        ? "Website opened in new tab! Password copied to clipboard — paste (Ctrl+V) into login form."
        : "Website opened in new tab! Username copied to clipboard."
    });
    setTimeout(() => setLaunchToast(null), 5000);

    triggerAppNotification(
      "INVOICE_GENERATED" as any,
      `Opened ${site.name}`,
      `Website opened in new tab with auto-copy login provision.`,
      { invoiceId: site.id }
    );
  };

  const handleToggleFavorite = (siteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sites.map((s) => (s.id === siteId ? { ...s, isFavorite: !s.isFavorite } : s));
    setSites(updated);
    saveImportantSites(updated);
  };

  const handleSaveSite = (savedSite: ImportantSite) => {
    let updated: ImportantSite[];
    const exists = sites.some((s) => s.id === savedSite.id);
    if (exists) {
      updated = sites.map((s) => (s.id === savedSite.id ? savedSite : s));
    } else {
      updated = [savedSite, ...sites];
    }
    setSites(updated);
    saveImportantSites(updated);

    triggerAppNotification(
      "INVOICE_GENERATED" as any,
      exists ? "Site Details Updated" : "New Website Added",
      `"${savedSite.name}" saved to Important Sites Vault.`,
      { invoiceId: savedSite.id }
    );
  };

  const handleConfirmDelete = () => {
    if (!siteToDelete) return;
    const remaining = deleteImportantSite(siteToDelete.id);
    setSites(remaining);
    setSiteToDelete(null);

    triggerAppNotification(
      "INVOICE_GENERATED" as any,
      "Site Removed",
      `Website was removed from Important Sites.`,
      { invoiceId: siteToDelete.id }
    );
  };

  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    const masterPin = getMasterPin();
    if (enteredPin === masterPin) {
      setIsLocked(false);
      setVaultLockedState(false);
      setShowPinPrompt(false);
      setEnteredPin("");
      setPinError("");
    } else {
      setPinError("Incorrect PIN. (Default PIN is 1234)");
    }
  };

  const handleToggleVaultLock = () => {
    if (!isLocked) {
      setIsLocked(true);
      setVaultLockedState(true);
      setVisiblePasswords({});
    } else {
      setShowPinPrompt(true);
    }
  };

  // Import JSON handler
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const merged = [...parsed, ...sites.filter((s) => !parsed.some((p: any) => p.id === s.id))];
          setSites(merged);
          saveImportantSites(merged);
          alert(`Successfully imported ${parsed.length} important sites!`);
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Failed to parse backup JSON file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Filtered sites
  const filteredSites = sites
    .filter((site) => {
      // Category filter
      if (selectedCategory === "FAVORITES") {
        if (!site.isFavorite) return false;
      } else if (selectedCategory !== "ALL") {
        if (site.category !== selectedCategory) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (site.name || "").toLowerCase().includes(q);
        const matchesUrl = (site.url || "").toLowerCase().includes(q);
        const matchesUser = (site.username || "").toLowerCase().includes(q);
        const matchesNotes = (site.notes || "").toLowerCase().includes(q);
        const matchesCategory = (site.customCategory || "").toLowerCase().includes(q);
        return matchesName || matchesUrl || matchesUser || matchesNotes || matchesCategory;
      }
      return true;
    })
    .sort((a, b) => {
      // Pinned favorites first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });

  const favoritesCount = sites.filter((s) => s.isFavorite).length;
  const lsgdCount = sites.filter((s) => s.category === "LSGD_GOVT").length;
  const surveyCount = sites.filter((s) => s.category === "REVENUE_SURVEY").length;
  const taxCount = sites.filter((s) => s.category === "TAX_BANKING").length;
  const cadCount = sites.filter((s) => s.category === "CAD_SOFTWARE").length;
  const utilityCount = sites.filter((s) => s.category === "UTILITY_OFFICE").length;

  const getCategoryBadge = (cat: ImportantSiteCategory, custom?: string) => {
    switch (cat) {
      case "LSGD_GOVT":
        return { text: "LSGD & Permits", color: "bg-emerald-950 text-emerald-300 border-emerald-800" };
      case "REVENUE_SURVEY":
        return { text: "Survey & Revenue", color: "bg-cyan-950 text-cyan-300 border-cyan-800" };
      case "TAX_BANKING":
        return { text: "Tax & Banking", color: "bg-indigo-950 text-indigo-300 border-indigo-800" };
      case "CAD_SOFTWARE":
        return { text: "CAD & Engineering", color: "bg-rose-950 text-rose-300 border-rose-800" };
      case "UTILITY_OFFICE":
        return { text: "Office Utilities", color: "bg-amber-950 text-amber-300 border-amber-800" };
      default:
        return { text: custom || "Custom Portal", color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  const getBorderColor = (color?: string) => {
    switch (color) {
      case "cyan":
        return "border-cyan-800/80 hover:border-cyan-400";
      case "blue":
        return "border-blue-800/80 hover:border-blue-400";
      case "indigo":
        return "border-indigo-800/80 hover:border-indigo-400";
      case "amber":
        return "border-amber-800/80 hover:border-amber-400";
      case "rose":
        return "border-rose-800/80 hover:border-rose-400";
      default:
        return "border-emerald-800/80 hover:border-emerald-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Launch Toast Notification Banner */}
      {launchToast && (
        <div className="bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl p-4 text-emerald-200 flex items-center justify-between gap-3 shadow-2xl animate-fade-in font-sans">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-900 border border-emerald-600 flex items-center justify-center text-emerald-300 font-bold shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono font-bold text-xs uppercase tracking-wider text-white">
                {launchToast.siteName} Launched!
              </div>
              <div className="text-xs text-emerald-300 font-medium">{launchToast.text}</div>
            </div>
          </div>

          <button
            onClick={() => setLaunchToast(null)}
            className="px-3 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 rounded-lg text-xs font-mono font-bold border border-emerald-700 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Top Header & Action Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-black">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 uppercase">
                  VAULT & AUTO-LOGIN
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {sites.length} Portals Stored
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white font-sans uppercase tracking-tight">
                Important Sites & Credentials Storage
              </h2>
            </div>
          </div>

          {/* Action Buttons: Add Site, Export, Import, Lock/Unlock */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Vault Lock / Unlock Button */}
            <button
              onClick={handleToggleVaultLock}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isLocked
                  ? "bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900/80"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title={isLocked ? "Vault is PIN-Protected. Click to Unlock" : "Click to Lock Credentials with Master PIN"}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isLocked ? "Vault Locked (PIN)" : "Vault Unlocked"}</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={() => exportSitesVaultJson(sites)}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Download offline backup JSON of all stored websites & credentials"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export Backup</span>
            </button>

            {/* Import JSON */}
            <label className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Import</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>

            {/* Add Website Button */}
            <button
              onClick={() => {
                setEditingSite(null);
                setIsNewEditModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs font-mono shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Important Website</span>
            </button>
          </div>
        </div>

        {/* Search Bar & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search websites by name, URL, username, or tag..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-sans transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs font-mono"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-300"
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-300"
              }`}
              title="Compact Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "ALL"
                ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <span>All Sites</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded-full text-[10px]">{sites.length}</span>
          </button>

          <button
            onClick={() => setSelectedCategory("FAVORITES")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "FAVORITES"
                ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                : "bg-slate-950 text-amber-400/80 hover:text-amber-300 border border-slate-800"
            }`}
          >
            <Star className="w-3 h-3 fill-amber-400" />
            <span>Pinned Favorites</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded-full text-[10px]">{favoritesCount}</span>
          </button>

          <button
            onClick={() => setSelectedCategory("LSGD_GOVT")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "LSGD_GOVT"
                ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-emerald-400/80 hover:text-emerald-300 border border-slate-800"
            }`}
          >
            <span>LSGD & Permits</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded-full text-[10px]">{lsgdCount}</span>
          </button>

          <button
            onClick={() => setSelectedCategory("REVENUE_SURVEY")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "REVENUE_SURVEY"
                ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                : "bg-slate-950 text-cyan-400/80 hover:text-cyan-300 border border-slate-800"
            }`}
          >
            <span>Survey & Revenue</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded-full text-[10px]">{surveyCount}</span>
          </button>

          <button
            onClick={() => setSelectedCategory("TAX_BANKING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "TAX_BANKING"
                ? "bg-indigo-500 text-slate-950 font-black shadow-md shadow-indigo-500/20"
                : "bg-slate-950 text-indigo-400/80 hover:text-indigo-300 border border-slate-800"
            }`}
          >
            <span>Tax, GST & Banking</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded-full text-[10px]">{taxCount}</span>
          </button>

          <button
            onClick={() => setSelectedCategory("CAD_SOFTWARE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "CAD_SOFTWARE"
                ? "bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20"
                : "bg-slate-950 text-rose-400/80 hover:text-rose-300 border border-slate-800"
            }`}
          >
            <span>CAD & Engineering</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded-full text-[10px]">{cadCount}</span>
          </button>

          <button
            onClick={() => setSelectedCategory("UTILITY_OFFICE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "UTILITY_OFFICE"
                ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                : "bg-slate-950 text-amber-400/80 hover:text-amber-300 border border-slate-800"
            }`}
          >
            <span>Office Utilities</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded-full text-[10px]">{utilityCount}</span>
          </button>
        </div>
      </div>

      {/* SITES DISPLAY CONTAINER */}
      {filteredSites.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Globe className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-sans">No Websites Found</h3>
            <p className="text-xs text-slate-400 font-mono">
              {searchQuery ? `No sites matching "${searchQuery}"` : "Add your required portal with auto-password login provisions."}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSite(null);
              setIsNewEditModalOpen(true);
            }}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs font-mono cursor-pointer transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Important Website Now</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSites.map((site) => {
            const badge = getCategoryBadge(site.category, site.customCategory);
            const isPasswordVisible = !!visiblePasswords[site.id];
            const borderCls = getBorderColor(site.color);

            return (
              <div
                key={site.id}
                className={`bg-slate-900/90 border ${borderCls} rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all hover:shadow-2xl relative group`}
              >
                {/* Card Top: Category Badge, Favorite Star & Action Icons */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.text}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Favorite Pin Star */}
                      <button
                        onClick={(e) => handleToggleFavorite(site.id, e)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title={site.isFavorite ? "Unpin Favorite" : "Pin to Favorites"}
                      >
                        <Star
                          className={`w-4 h-4 ${site.isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
                        />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingSite(site);
                          setIsNewEditModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Website & Credentials"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          setSiteToDelete(site);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Portal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title and Direct Link */}
                  <div>
                    <h3 className="text-sm font-black text-white font-sans tracking-tight line-clamp-1">
                      {site.name}
                    </h3>
                    <a
                      href={site.url.startsWith("http") ? site.url : `https://${site.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 mt-0.5 truncate"
                    >
                      <span className="truncate">{site.url.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  {/* Notes / Remarks if available */}
                  {site.notes && (
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      {site.notes}
                    </p>
                  )}
                </div>

                {/* Credentials Storage Vault Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 text-xs font-mono">
                  {/* Username Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-400 truncate">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-200 font-bold truncate select-all">{site.username}</span>
                    </div>

                    <button
                      onClick={() => handleCopy(site.id, "username", site.username)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] border border-slate-800 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      title="Copy Username"
                    >
                      {copiedField?.id === site.id && copiedField?.field === "username" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>
                        {copiedField?.id === site.id && copiedField?.field === "username" ? "Copied" : "Copy ID"}
                      </span>
                    </button>
                  </div>

                  {/* Password Row */}
                  <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
                    <div className="flex items-center gap-1.5 text-slate-400 truncate">
                      <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {site.password ? (
                        <span className="text-slate-200 font-bold tracking-wider truncate">
                          {isPasswordVisible && !isLocked ? site.password : "••••••••••••"}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">No password stored</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {site.password && (
                        <>
                          <button
                            onClick={() => handleTogglePassword(site.id)}
                            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-900 transition-colors"
                            title={isPasswordVisible && !isLocked ? "Hide Password" : "Show Password"}
                          >
                            {isPasswordVisible && !isLocked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleCopy(site.id, "password", site.password || "")}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] border border-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                            title="Copy Password to Clipboard"
                          >
                            {copiedField?.id === site.id && copiedField?.field === "password" ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>
                              {copiedField?.id === site.id && copiedField?.field === "password" ? "Copied" : "Copy Pass"}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Security PIN or OTP mobile if stored */}
                  {site.securityPin && (
                    <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2 text-[10px]">
                      <div className="flex items-center gap-1.5 text-slate-400 truncate">
                        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="text-amber-300 font-bold truncate">PIN/OTP: {site.securityPin}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(site.id, "pin", site.securityPin || "")}
                        className="text-slate-400 hover:text-white p-0.5"
                        title="Copy PIN"
                      >
                        {copiedField?.id === site.id && copiedField?.field === "pin" ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Primary Action Bar */}
                <div className="space-y-2 pt-1">
                  {/* Primary 1-Click Open & Auto-Copy Button */}
                  <button
                    onClick={() => handleOpenAndAutoCopy(site)}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs font-mono shadow-md shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open & Auto-Copy Password</span>
                  </button>

                  {/* Auto-Login Helper Bookmarklet Trigger */}
                  <button
                    onClick={() => {
                      setSelectedHelperSite(site);
                      setIsAutoLoginModalOpen(true);
                    }}
                    className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-800 text-slate-400 hover:text-cyan-300 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>Auto-Login Bookmarklet Helper</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-950 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Website & Portal</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Username / ID</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4">Primary Launch</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredSites.map((site) => {
                  const badge = getCategoryBadge(site.category, site.customCategory);
                  const isPasswordVisible = !!visiblePasswords[site.id];

                  return (
                    <tr key={site.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Name & URL */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleToggleFavorite(site.id, e)}
                            className="text-slate-400 hover:text-amber-400"
                          >
                            <Star className={`w-3.5 h-3.5 ${site.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                          </button>
                          <span className="font-bold text-white line-clamp-1">{site.name}</span>
                        </div>
                        <a
                          href={site.url.startsWith("http") ? site.url : `https://${site.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 ml-5"
                        >
                          <span>{site.url.replace(/^https?:\/\//, "")}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.text}
                        </span>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="select-all font-bold">{site.username}</span>
                          <button
                            onClick={() => handleCopy(site.id, "username", site.username)}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Copy Username"
                          >
                            {copiedField?.id === site.id && copiedField?.field === "username" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Password */}
                      <td className="py-3.5 px-4 font-mono">
                        {site.password ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300 font-bold">
                              {isPasswordVisible && !isLocked ? site.password : "••••••••"}
                            </span>
                            <button
                              onClick={() => handleTogglePassword(site.id)}
                              className="p-1 text-slate-400 hover:text-white"
                              title={isPasswordVisible && !isLocked ? "Hide Password" : "Show Password"}
                            >
                              {isPasswordVisible && !isLocked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopy(site.id, "password", site.password || "")}
                              className="p-1 text-slate-400 hover:text-white"
                              title="Copy Password"
                            >
                              {copiedField?.id === site.id && copiedField?.field === "password" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">None</span>
                        )}
                      </td>

                      {/* Primary Launch */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenAndAutoCopy(site)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open & Auto-Copy</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedHelperSite(site);
                              setIsAutoLoginModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800"
                            title="Auto-Login Bookmarklet Helper"
                          >
                            <Zap className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingSite(site);
                              setIsNewEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800"
                            title="Edit Site"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSiteToDelete(site);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                            title="Delete Site"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* MASTER PIN UNLOCK MODAL */}
      {showPinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white font-sans uppercase">
                Unlock Password Vault
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Enter your 4-digit Office Master PIN to view passwords. (Default: 1234)
              </p>
            </div>

            <form onSubmit={handleUnlockWithPin} className="space-y-3 pt-2">
              <input
                type="password"
                maxLength={8}
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError("");
                }}
                autoFocus
                placeholder="Enter PIN (1234)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-amber-400"
              />
              {pinError && <p className="text-xs text-red-400 font-mono">{pinError}</p>}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinPrompt(false);
                    setEnteredPin("");
                    setPinError("");
                  }}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl font-mono text-xs cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Site Modal */}
      <NewEditSiteModal
        isOpen={isNewEditModalOpen}
        onClose={() => {
          setIsNewEditModalOpen(false);
          setEditingSite(null);
        }}
        onSave={handleSaveSite}
        siteToEdit={editingSite}
      />

      {/* Auto-Login Provisions & Bookmarklet Helper Modal */}
      <AutoLoginHelperModal
        isOpen={isAutoLoginModalOpen}
        onClose={() => {
          setIsAutoLoginModalOpen(false);
          setSelectedHelperSite(null);
        }}
        site={selectedHelperSite}
      />

      {/* Delete Confirmation Modal */}
      <DeleteSiteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSiteToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        site={siteToDelete}
      />
    </div>
  );
};
