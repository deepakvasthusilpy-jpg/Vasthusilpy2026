import React, { useState, useEffect, useMemo } from "react";
import {
  CADDrawingRecord,
  CADMetadataIndexItem,
  CADStorageFilter,
  CADCategory,
  CADFileType,
  CADFolder
} from "../../types/dataStorageTypes";
import {
  getStoredCADFolders,
  getCADMetadataIndex,
  getCADDrawingRecordById,
  deleteCADDrawingRecord,
  toggleStarCADDrawing,
  resetAndWipeCadStorage,
  formatBytes,
  downloadAttachment,
  triggerDxfDownload
} from "../../utils/dataStorageManager";
import { CadFileEditModal } from "./dataStorage/CadFileEditModal";
import { CadViewerEditorModal } from "./dataStorage/CadViewerEditorModal";
import { PdfViewerModal } from "./dataStorage/PdfViewerModal";
import { CadFileShareModal } from "./dataStorage/CadFileShareModal";
import { FolderManageModal } from "./dataStorage/FolderManageModal";
import { GoogleDriveSyncModal } from "./dataStorage/GoogleDriveSyncModal";
import {
  Folder,
  FolderPlus,
  FolderTree,
  FileCode,
  FileText,
  Image as ImageIcon,
  Plus,
  Search,
  Filter,
  Share2,
  Download,
  Eye,
  Edit2,
  Trash2,
  Star,
  Cloud,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  User,
  Phone,
  Compass,
  Home,
  Layers,
  Sparkles,
  ExternalLink,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  FileUp,
  HardDrive,
  Grid,
  List,
  ArrowUpDown,
  Tag,
  ShieldAlert,
  X
} from "lucide-react";

interface DataStorageTabProps {
  userRole?: string;
  userEmail?: string;
}

const FACING_FILTERS = [
  { label: "All Facings", value: "" },
  { label: "East (കിഴക്ക്)", value: "East" },
  { label: "West (പടിഞ്ഞാറ്)", value: "West" },
  { label: "North (വടക്ക്)", value: "North" },
  { label: "South (തെക്ക്)", value: "South" },
  { label: "North-East (ഈശാന)", value: "North-East" },
  { label: "North-West (വായു)", value: "North-West" },
  { label: "South-East (അഗ്നി)", value: "South-East" },
  { label: "South-West (നിര്യതി)", value: "South-West" }
];

const BEDROOM_FILTERS = [
  { label: "All BHKs", value: "" },
  { label: "1 BHK", value: "1 BHK" },
  { label: "2 BHK", value: "2 BHK" },
  { label: "3 BHK", value: "3 BHK" },
  { label: "4 BHK", value: "4 BHK" },
  { label: "5+ BHK", value: "5+ BHK" }
];

const FLOOR_FILTERS = [
  { label: "All Floors", value: "" },
  { label: "Single Floor", value: "Single Floor" },
  { label: "G + 1 (2 Floors)", value: "G + 1" },
  { label: "G + 2 (3 Floors)", value: "G + 2" },
  { label: "Multi-Storey", value: "Multi-Storey" }
];

export const DataStorageTab: React.FC<DataStorageTabProps> = ({
  userRole = "ADMIN",
  userEmail = "deepak@vasthusilpy.com"
}) => {
  // Navigation & Folder Selection State
  const [folders, setFolders] = useState<CADFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null); // null = All Folders

  // Metadata Index State
  const [indexItems, setIndexItems] = useState<CADMetadataIndexItem[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [facingFilter, setFacingFilter] = useState("");
  const [bedroomFilter, setBedroomFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CADCategory | "">("");
  const [formatFilter, setFormatFilter] = useState<CADFileType | "ALL">("ALL");
  const [starredOnly, setStarredOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "name" | "size" | "owner">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<CADDrawingRecord | null>(null);

  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<CADDrawingRecord | null>(null);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewingFile, setPdfViewingFile] = useState<CADDrawingRecord | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingFile, setSharingFile] = useState<CADDrawingRecord | null>(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<CADFolder | null>(null);
  const [selectedParentForNewFolder, setSelectedParentForNewFolder] = useState<string | null>(null);

  const [isDriveSyncModalOpen, setIsDriveSyncModalOpen] = useState(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);

  // Load Folders & Index on Mount & Refresh
  const reloadData = () => {
    const loadedFolders = getStoredCADFolders();
    const loadedIndex = getCADMetadataIndex();
    setFolders(loadedFolders);
    setIndexItems(loadedIndex);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Compute Folder stats
  const folderStats = useMemo(() => {
    const counts: Record<string, number> = {};
    indexItems.forEach((item) => {
      const fId = item.folderId || "folder-deepak";
      counts[fId] = (counts[fId] || 0) + 1;
    });
    return counts;
  }, [indexItems]);

  const activeFolder = useMemo(() => {
    if (!activeFolderId) return null;
    return folders.find((f) => f.id === activeFolderId) || null;
  }, [folders, activeFolderId]);

  // Recursive check if a folder is descendant of target folder
  const isFolderDescendantOf = (folderId: string, targetParentId: string): boolean => {
    if (!folderId || !targetParentId) return false;
    if (folderId === targetParentId) return true;
    const f = folders.find((item) => item.id === folderId);
    if (!f || !f.parentId) return false;
    if (f.parentId === targetParentId) return true;
    return isFolderDescendantOf(f.parentId, targetParentId);
  };

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return indexItems.filter((item) => {
      // 1. Folder filter (matches current folder OR any subfolder/descendant)
      if (activeFolderId && item.folderId !== activeFolderId) {
        if (!isFolderDescendantOf(item.folderId, activeFolderId)) {
          return false;
        }
      }

      // 2. Starred filter
      if (starredOnly && !item.isStarred) {
        return false;
      }

      // 3. Format filter
      if (formatFilter !== "ALL" && item.fileType !== formatFilter) {
        return false;
      }

      // 4. Category filter
      if (categoryFilter && item.category !== categoryFilter) {
        return false;
      }

      // 5. Facing filter
      if (facingFilter && (!item.facing || !item.facing.toLowerCase().includes(facingFilter.toLowerCase()))) {
        return false;
      }

      // 6. Bedrooms filter
      if (bedroomFilter && (!item.bedrooms || !item.bedrooms.toLowerCase().includes(bedroomFilter.toLowerCase()))) {
        return false;
      }

      // 7. Floors filter
      if (floorFilter && (!item.floors || !item.floors.toLowerCase().includes(floorFilter.toLowerCase()))) {
        return false;
      }

      // 8. Multi-Parameter Text Search (Name, Owner, Mobile, Facing, Vasthu Chuttu, Keywords, Project)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchPool = [
          item.name,
          item.title,
          item.projectName,
          item.projectCode,
          item.ownerName,
          item.clientName,
          item.mobileNo,
          item.clientPhone,
          item.facing,
          item.bedrooms,
          item.floors,
          item.vasthuChuttu,
          item.location,
          item.folderPath,
          ...(item.keywords || [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        // Support multiple search terms (e.g. "Deepak 3bhk east")
        const tokens = q.split(/\s+/).filter(Boolean);
        const matchesAllTokens = tokens.every((token) => searchPool.includes(token));
        if (!matchesAllTokens) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "owner") {
        comparison = (a.ownerName || "").localeCompare(b.ownerName || "");
      } else if (sortBy === "size") {
        comparison = (b.fileSize || 0) - (a.fileSize || 0);
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });
  }, [
    indexItems,
    folders,
    activeFolderId,
    starredOnly,
    formatFilter,
    categoryFilter,
    facingFilter,
    bedroomFilter,
    floorFilter,
    searchQuery,
    sortBy,
    sortOrder
  ]);

  // Actions
  const handleOpenFile = (item: CADMetadataIndexItem) => {
    const fullRecord = getCADDrawingRecordById(item.id);
    if (!fullRecord) return;

    if (item.fileType === "PDF" || (!fullRecord.drawingData && fullRecord.attachments?.some((a) => a.isPdf))) {
      setPdfViewingFile(fullRecord);
      setIsPdfModalOpen(true);
    } else {
      setViewingFile(fullRecord);
      setIsViewerModalOpen(true);
    }
  };

  const handleOpenPdfViewer = (item: CADMetadataIndexItem) => {
    const fullRecord = getCADDrawingRecordById(item.id);
    if (fullRecord) {
      setPdfViewingFile(fullRecord);
      setIsPdfModalOpen(true);
    }
  };

  const handleOpenEdit = (item: CADMetadataIndexItem) => {
    const fullRecord = getCADDrawingRecordById(item.id);
    if (fullRecord) {
      setEditingFile(fullRecord);
      setIsEditModalOpen(true);
    }
  };

  const handleOpenShare = (item: CADMetadataIndexItem) => {
    const fullRecord = getCADDrawingRecordById(item.id);
    if (fullRecord) {
      setSharingFile(fullRecord);
      setIsShareModalOpen(true);
    }
  };

  const handleToggleStar = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStarCADDrawing(itemId);
    reloadData();
  };

  const handleDeleteFile = (item: CADMetadataIndexItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete drawing "${item.name}" from ${item.folderPath}?`)) {
      deleteCADDrawingRecord(item.id);
      reloadData();
    }
  };

  const handleQuickDownload = (item: CADMetadataIndexItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullRecord = getCADDrawingRecordById(item.id);
    if (!fullRecord) return;

    if (fullRecord.attachments && fullRecord.attachments.length > 0) {
      downloadAttachment(fullRecord.attachments[0], fullRecord.attachments[0].name || item.name);
    } else if (fullRecord.drawingData) {
      triggerDxfDownload(fullRecord.drawingData, `${item.name.replace(/\.[^/.]+$/, "")}.dxf`);
    } else {
      const blob = new Blob([`Vasthusilpy CAD Data: ${item.name}`], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Wipe All Storage Confirmation
  const handleWipeAll = () => {
    resetAndWipeCadStorage();
    reloadData();
    setActiveFolderId(null);
    setIsWipeConfirmOpen(false);
  };

  const totalVaultSize = useMemo(() => {
    return indexItems.reduce((sum, item) => sum + (item.fileSize || 0), 0);
  }, [indexItems]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                OFFICE CAD & DRAWING VAULT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono font-bold flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                Google Drive Ready
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              Office CAD Data Storage & Drawing Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-mono">
              Hierarchical folder vaults (VISHNU, DEEPAK, DIBIN), AutoCAD DWG/DXF, Architectural PDFs, 3D elevations, live QR code links, and Vasthu Chuttu index.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setEditingFile(null);
                setIsEditModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add / Upload Drawing</span>
            </button>

            <button
              onClick={() => {
                setFolderToEdit(null);
                setSelectedParentForNewFolder(activeFolderId);
                setIsFolderModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 border border-slate-700 cursor-pointer transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>+ New Folder</span>
            </button>

            <button
              onClick={() => setIsDriveSyncModalOpen(true)}
              title="Synchronize Web Data, CAD Vault & Google Drive"
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-slate-800 to-cyan-950 hover:from-slate-700 hover:to-cyan-900 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 border border-cyan-800/60 cursor-pointer transition-colors shadow-sm"
            >
              <Cloud className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">Web & Drive Sync</span>
            </button>

            <button
              onClick={() => setIsWipeConfirmOpen(true)}
              title="Delete All Settings & Reset Folders"
              className="px-3 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden xl:inline">Delete All Settings</span>
            </button>
          </div>
        </div>

        {/* Vault Key Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center justify-center shrink-0">
              <FolderTree className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Folders</div>
              <div className="text-base font-black text-white font-mono">{folders.length} Folders</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Total Files</div>
              <div className="text-base font-black text-white font-mono">{indexItems.length} Drawings</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Storage Size</div>
              <div className="text-base font-black text-amber-300 font-mono">
                {formatBytes(totalVaultSize)}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase">QR Sharing</div>
              <div className="text-base font-black text-emerald-300 font-mono">Live Enabled</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Folder Navigation Ribbon (Root Folders: VISHNU, DEEPAK, DIBIN & Subfolders) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Vault Directory Navigation
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeFolder && (
              <button
                onClick={() => {
                  setFolderToEdit(activeFolder);
                  setIsFolderModalOpen(true);
                }}
                className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Folder</span>
              </button>
            )}
            <button
              onClick={() => {
                setFolderToEdit(null);
                setSelectedParentForNewFolder(activeFolderId);
                setIsFolderModalOpen(true);
              }}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Nested Subfolder</span>
            </button>
          </div>
        </div>

        {/* Folder Badges / Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {/* All Folders Button */}
          <button
            onClick={() => setActiveFolderId(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeFolderId === null
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-950 border border-cyan-400"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>All Folders</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] text-slate-300 border border-slate-800">
              {indexItems.length}
            </span>
          </button>

          {/* Root Folders: VISHNU, DEEPAK, DIBIN & Subfolders */}
          {folders.map((folder) => {
            const count = folderStats[folder.id] || 0;
            const isSelected = activeFolderId === folder.id;
            const isSubfolder = Boolean(folder.parentId);

            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-slate-800 text-white shadow-md border-cyan-500"
                    : "bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color || "#38bdf8" }}
                />
                <Folder className="w-3.5 h-3.5" style={{ color: folder.color || "#38bdf8" }} />
                <span>
                  {isSubfolder ? `↳ ${folder.name}` : folder.name}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] text-slate-400 border border-slate-800">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Breadcrumb Path */}
        {activeFolder && (
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 pt-1">
            <span className="text-slate-500">Active Path:</span>
            <span className="text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              📁 {activeFolder.path}
            </span>
            {activeFolder.description && (
              <span className="text-slate-500 truncate hidden md:inline">
                • {activeFolder.description}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Comprehensive Search & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Drawing Name, Owner Name, Mobile No, Facing, Bedrooms, Floors, Vasthu Chuttu, Keywords..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-9 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category & Format Filters */}
          <div className="flex items-center gap-2">
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as CADFileType | "ALL")}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All File Formats</option>
              <option value="DWG">AutoCAD DWG</option>
              <option value="PDF">Architectural PDF</option>
              <option value="DXF">AutoCAD DXF</option>
              <option value="IMAGE">3D / Images</option>
              <option value="CAD_VECTOR">2D CAD Canvas</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAdvancedFilters || facingFilter || bedroomFilter || floorFilter || categoryFilter
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                  : "bg-slate-950 border-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Advanced Filters</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "table" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Advanced Multi-Parameter Filter Bar (Facing, Bedrooms, Floors, Category, Starred) */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Facing Filter */}
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                Facing (ദിശ)
              </label>
              <select
                value={facingFilter}
                onChange={(e) => setFacingFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-cyan-500"
              >
                {FACING_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bedroom Filter */}
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                Bedrooms (BHK)
              </label>
              <select
                value={bedroomFilter}
                onChange={(e) => setBedroomFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              >
                {BEDROOM_FILTERS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Floor Filter */}
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                Number of Floors
              </label>
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-cyan-500"
              >
                {FLOOR_FILTERS.map((fl) => (
                  <option key={fl.value} value={fl.value}>
                    {fl.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Starred & Reset */}
            <div className="flex items-end gap-2">
              <button
                onClick={() => setStarredOnly(!starredOnly)}
                className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  starredOnly
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                    : "bg-slate-950 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${starredOnly ? "fill-amber-400" : ""}`} />
                <span>Starred Only</span>
              </button>

              {(facingFilter || bedroomFilter || floorFilter || categoryFilter || starredOnly || searchQuery) && (
                <button
                  onClick={() => {
                    setFacingFilter("");
                    setBedroomFilter("");
                    setFloorFilter("");
                    setCategoryFilter("");
                    setStarredOnly(false);
                    setSearchQuery("");
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Filter Results Summary & Sorting */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <div>
          Showing <strong className="text-white">{filteredItems.length}</strong> of{" "}
          <strong className="text-white">{indexItems.length}</strong> drawings
          {activeFolder && (
            <span>
              {" "}
              in <span className="text-cyan-400 font-bold">{activeFolder.path}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="date">Date Updated</option>
            <option value="name">Drawing Name</option>
            <option value="owner">Owner Name</option>
            <option value="size">File Size</option>
          </select>
          <button
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Drawings Display (Grid Cards or Detailed Table) */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <FileCode className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white font-mono mb-1">
            No Drawings Found Matching Your Filters
          </h3>
          <p className="text-xs text-slate-400 font-mono max-w-md mx-auto mb-6">
            Try adjusting your search keywords, clear the facing/bedroom filters, or upload a new CAD/PDF drawing to this vault folder.
          </p>
          <button
            onClick={() => {
              setEditingFile(null);
              setIsEditModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Drawing Now</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isDwg = item.fileType === "DWG";
            const isPdf = item.fileType === "PDF";
            const isDxf = item.fileType === "DXF";
            const isImage = item.fileType === "IMAGE";

            return (
              <div
                key={item.id}
                onClick={() => handleOpenFile(item)}
                className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden"
              >
                {/* Top Header Card */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isPdf
                            ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                            : isImage
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                            : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                        }`}
                      >
                        {isPdf ? (
                          <FileText className="w-5 h-5" />
                        ) : isImage ? (
                          <ImageIcon className="w-5 h-5" />
                        ) : (
                          <FileCode className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                              isPdf
                                ? "bg-rose-950 text-rose-300 border-rose-800"
                                : isImage
                                ? "bg-amber-950 text-amber-300 border-amber-800"
                                : "bg-cyan-950 text-cyan-300 border-cyan-800"
                            }`}
                          >
                            {item.fileType}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 truncate">
                            📁 {item.folderPath}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white font-mono truncate group-hover:text-cyan-300 transition-colors mt-0.5">
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleToggleStar(item.id, e)}
                      className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          item.isStarred ? "fill-amber-400 text-amber-400" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Owner & Project Name */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs font-mono mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-cyan-400" />
                        Owner / Client:
                      </span>
                      <span className="font-bold text-white truncate max-w-[140px]">
                        {item.ownerName || item.clientName || "Vasthusilpy Client"}
                      </span>
                    </div>

                    {item.mobileNo && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          Mobile:
                        </span>
                        <span className="text-slate-300">{item.mobileNo}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500">Project:</span>
                      <span className="text-cyan-300 truncate max-w-[160px] font-bold">
                        {item.projectName}
                      </span>
                    </div>
                  </div>

                  {/* Architectural Specs Badges (Facing, BHK, Floors, Vasthu) */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-3">
                    {item.facing && (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate text-amber-300 font-bold">{item.facing}</span>
                      </div>
                    )}

                    {item.bedrooms && (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate text-cyan-300 font-bold">{item.bedrooms}</span>
                      </div>
                    )}

                    {item.floors && (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate text-purple-300 font-bold">{item.floors}</span>
                      </div>
                    )}

                    {item.builtUpArea && (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Plinth:</span>
                        <span className="truncate text-emerald-300 font-bold">
                          {item.builtUpArea}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Vasthu Chuttu Badge */}
                  {item.vasthuChuttu && (
                    <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-[11px] font-mono mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400">വാസ്തു ചുറ്റ്:</span>
                      <span className="font-bold truncate max-w-[190px]">{item.vasthuChuttu}</span>
                    </div>
                  )}

                  {/* Keywords Tag Badges */}
                  {item.keywords && item.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.keywords.slice(0, 3).map((kw, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-slate-400 border border-slate-800 font-mono"
                        >
                          #{kw}
                        </span>
                      ))}
                      {item.keywords.length > 3 && (
                        <span className="text-[10px] text-slate-500 self-center font-mono">
                          +{item.keywords.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-slate-500">
                    {formatBytes(item.fileSize)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Preview / CAD Viewer */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFile(item);
                      }}
                      title="Open 2D CAD / PDF Viewer"
                      className="p-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* PDF Viewer (if available) */}
                    {(item.fileType === "PDF" || item.hasPdf) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPdfViewer(item);
                        }}
                        title="View PDF Document"
                        className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Share / QR Code */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenShare(item);
                      }}
                      title="Share Drawing & QR Code"
                      className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Download */}
                    <button
                      onClick={(e) => handleQuickDownload(item, e)}
                      title="Download Drawing File"
                      className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(item);
                      }}
                      title="Edit Metadata & Specs"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDeleteFile(item, e)}
                      title="Delete Drawing"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="p-3.5">Drawing File & Title</th>
                  <th className="p-3.5">Folder</th>
                  <th className="p-3.5">Owner & Mobile</th>
                  <th className="p-3.5">Facing & Specs</th>
                  <th className="p-3.5">വാസ്തു ചുറ്റ്</th>
                  <th className="p-3.5">Format / Size</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenFile(item)}
                    className="hover:bg-slate-850/80 cursor-pointer transition-colors group"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={(e) => handleToggleStar(item.id, e)}
                          className="text-slate-500 hover:text-amber-400"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              item.isStarred ? "fill-amber-400 text-amber-400" : ""
                            }`}
                          />
                        </button>
                        <div>
                          <div className="font-bold text-white group-hover:text-cyan-300">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{item.projectName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 text-cyan-300 border border-slate-800 text-[10px]">
                        📁 {item.folderPath}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-200">
                        {item.ownerName || item.clientName || "—"}
                      </div>
                      {item.mobileNo && (
                        <div className="text-[10px] text-emerald-400">{item.mobileNo}</div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="text-amber-300 font-bold">{item.facing || "—"}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.bedrooms || "—"} • {item.floors || "—"}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="text-amber-200 font-bold text-[11px]">
                        {item.vasthuChuttu || "—"}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-bold text-[10px]">
                        {item.fileType}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {formatBytes(item.fileSize)}
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFile(item);
                          }}
                          title="Preview CAD/PDF"
                          className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenShare(item);
                          }}
                          title="Share & QR Code"
                          className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleQuickDownload(item, e)}
                          title="Download"
                          className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(item);
                          }}
                          title="Edit"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. All Associated Modals */}

      {/* File Edit / Upload Modal */}
      {isEditModalOpen && (
        <CadFileEditModal
          file={editingFile}
          defaultFolderId={activeFolderId}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={() => {
            reloadData();
            setIsEditModalOpen(false);
          }}
          userEmail={userEmail}
        />
      )}

      {/* CAD 2D Vector & Canvas Viewer Modal */}
      {isViewerModalOpen && viewingFile && (
        <CadViewerEditorModal
          file={viewingFile}
          isOpen={isViewerModalOpen}
          onClose={() => setIsViewerModalOpen(false)}
          onSave={() => {
            reloadData();
          }}
        />
      )}

      {/* PDF Document Viewer Modal */}
      {isPdfModalOpen && pdfViewingFile && (
        <PdfViewerModal
          file={pdfViewingFile}
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          onOpenShare={(fileToShare) => {
            setSharingFile(fileToShare);
            setIsShareModalOpen(true);
          }}
        />
      )}

      {/* Share & QR Code Modal */}
      {isShareModalOpen && sharingFile && (
        <CadFileShareModal
          file={sharingFile}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onUpdated={() => {
            reloadData();
          }}
        />
      )}

      {/* Folder Creation & Management Modal */}
      {isFolderModalOpen && (
        <FolderManageModal
          isOpen={isFolderModalOpen}
          onClose={() => setIsFolderModalOpen(false)}
          onFoldersUpdated={() => {
            reloadData();
          }}
          selectedParentId={selectedParentForNewFolder}
          editingFolder={folderToEdit}
        />
      )}

      {/* Google Drive Sync Modal */}
      {isDriveSyncModalOpen && (
        <GoogleDriveSyncModal
          isOpen={isDriveSyncModalOpen}
          onClose={() => setIsDriveSyncModalOpen(false)}
          onSyncComplete={() => {
            reloadData();
          }}
          totalFiles={indexItems.length}
        />
      )}

      {/* Wipe / Delete All Settings Confirmation Dialog */}
      {isWipeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl shadow-2xl w-full max-w-md p-6 font-mono space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white">
                Delete All Settings & Reset Vault?
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                This will delete all current settings, clear previous records, and recreate the 3 clean root folders:{" "}
                <strong className="text-cyan-300">"VISHNU"</strong>,{" "}
                <strong className="text-amber-300">"DEEPAK"</strong>, and{" "}
                <strong className="text-emerald-300">"DIBIN"</strong> with fresh starter architectural records.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsWipeConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleWipeAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Reset All Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
