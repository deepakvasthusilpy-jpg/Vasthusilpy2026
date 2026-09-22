import React, { useState, useEffect, useMemo } from "react";
import {
  CADDrawingRecord,
  CADMetadataIndexItem,
  CADCategory,
  CADFileType,
  CADFolder
} from "../../types/dataStorageTypes";
import { TabType, DataStorageVaultTabType } from "../../types";
import { getBroadcastChannel } from "../../utils/broadcastSync";
import {
  getStoredCADFolders,
  getCADMetadataIndex,
  getCADDrawingRecordById,
  deleteCADDrawingRecord,
  deleteCADFolder,
  toggleStarCADDrawing,
  resetAndWipeCadStorage,
  formatBytes,
  downloadAttachment,
  downloadRecordFile
} from "../../utils/dataStorageManager";
import { CadFileEditModal } from "./dataStorage/CadFileEditModal";
import { PdfViewerModal } from "./dataStorage/PdfViewerModal";
import { CadFileShareModal } from "./dataStorage/CadFileShareModal";
import { FolderManageModal } from "./dataStorage/FolderManageModal";
import { FolderDeleteModal } from "./dataStorage/FolderDeleteModal";
import { FileDeleteModal } from "./dataStorage/FileDeleteModal";
import { GoogleDriveSyncModal } from "./dataStorage/GoogleDriveSyncModal";
import {
  Folder,
  FolderPlus,
  FolderTree,
  FolderX,
  FileCode,
  FileText,
  Image as ImageIcon,
  Plus,
  Search,
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
  QrCode,
  HardDrive,
  Grid,
  List,
  ArrowUpDown,
  ShieldAlert,
  AlertTriangle,
  X,
  LayoutGrid,
  Settings,
  FileSpreadsheet,
  MapPin,
  Database,
  ArrowRight,
  Info,
  Check,
  CheckSquare,
  Square,
  Upload
} from "lucide-react";

interface DataStorageTabProps {
  userRole?: string;
  userEmail?: string;
  activeSubTab?: TabType;
  onSubTabChange?: (tab: TabType) => void;
  onNavigateVaultTab?: (tab: TabType) => void;
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

// 5 Required Categories Specification
const VAULT_CATEGORIES: {
  id: CADCategory;
  tabId: DataStorageVaultTabType;
  number: string;
  title: string;
  titleMl: string;
  description: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgBadge: string;
}[] = [
  {
    id: "PLAN",
    tabId: "vault_plan",
    number: "1",
    title: "PLAN",
    titleMl: "പ്ലാൻ (Architectural, Vastu & 2D CAD)",
    description: "Architectural floor plans, Vasthu diagrams, structural drawings, AutoCAD DWG/DXF files.",
    icon: Compass,
    color: "text-cyan-400",
    borderColor: "border-cyan-500/40",
    bgBadge: "bg-cyan-950/70 text-cyan-300 border-cyan-800"
  },
  {
    id: "3D",
    tabId: "vault_3d",
    number: "2",
    title: "3D",
    titleMl: "3D എലിവേഷൻ & വിഷ്വലൈസേഷൻ",
    description: "3D architectural elevations, realistic renderings, interior walkthroughs and exterior views.",
    icon: Layers,
    color: "text-purple-400",
    borderColor: "border-purple-500/40",
    bgBadge: "bg-purple-950/70 text-purple-300 border-purple-800"
  },
  {
    id: "ESTIMATE",
    tabId: "vault_estimate",
    number: "3",
    title: "ESTIMATE",
    titleMl: "എസ്റ്റിമേറ്റ് & BOQ",
    description: "Detailed bill of quantities (BOQ), bank stage estimates, rate analysis, and Excel/PDF sheets.",
    icon: FileSpreadsheet,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/40",
    bgBadge: "bg-emerald-950/70 text-emerald-300 border-emerald-800"
  },
  {
    id: "SURVEY",
    tabId: "vault_survey",
    number: "4",
    title: "SURVEY",
    titleMl: "ലാൻഡ് സർവ്വേ & FMB",
    description: "Field Measurement Books (FMB), site boundaries, coordinate surveys, plot sketches and contour maps.",
    icon: MapPin,
    color: "text-amber-400",
    borderColor: "border-amber-500/40",
    bgBadge: "bg-amber-950/70 text-amber-300 border-amber-800"
  },
  {
    id: "DOCUMENTS",
    tabId: "vault_documents",
    number: "5",
    title: "DOCUMENTS",
    titleMl: "ഓഫീസ് രേഖകൾ & പെർമിറ്റുകൾ",
    description: "LSGD K-Smart permits, occupancy certificates, ownership deeds, agreements, and client papers.",
    icon: FileText,
    color: "text-blue-400",
    borderColor: "border-blue-500/40",
    bgBadge: "bg-blue-950/70 text-blue-300 border-blue-800"
  }
];

export const DataStorageTab: React.FC<DataStorageTabProps> = ({
  userRole = "ADMIN",
  userEmail = "deepak@vasthusilpy.com",
  activeSubTab,
  onSubTabChange,
  onNavigateVaultTab
}) => {
  // Navigation & Sub-Tabs State
  const [currentSubTab, setCurrentSubTab] = useState<DataStorageVaultTabType>(() => {
    if (activeSubTab && [
      "vault_dashboard",
      "vault_plan",
      "vault_3d",
      "vault_estimate",
      "vault_survey",
      "vault_documents",
      "vault_settings"
    ].includes(activeSubTab)) {
      return activeSubTab as DataStorageVaultTabType;
    }
    return "vault_dashboard";
  });

  // Sync with prop when changed externally
  useEffect(() => {
    if (activeSubTab && [
      "vault_dashboard",
      "vault_plan",
      "vault_3d",
      "vault_estimate",
      "vault_survey",
      "vault_documents",
      "vault_settings"
    ].includes(activeSubTab)) {
      setCurrentSubTab(activeSubTab as DataStorageVaultTabType);
    }
  }, [activeSubTab]);

  const handleSwitchTab = (tab: DataStorageVaultTabType) => {
    setCurrentSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
    if (onNavigateVaultTab) {
      onNavigateVaultTab(tab);
    }
  };

  // Folders & Data State
  const [folders, setFolders] = useState<CADFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null); // null = All Folders
  const [indexItems, setIndexItems] = useState<CADMetadataIndexItem[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [facingFilter, setFacingFilter] = useState("");
  const [bedroomFilter, setBedroomFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState<CADFileType | "ALL">("ALL");
  const [starredOnly, setStarredOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "name" | "size" | "owner">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<CADDrawingRecord | null>(null);
  const [uploadDefaultCategory, setUploadDefaultCategory] = useState<CADCategory>("PLAN");

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewingFile, setPdfViewingFile] = useState<CADDrawingRecord | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingFile, setSharingFile] = useState<CADDrawingRecord | null>(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<CADFolder | null>(null);
  const [selectedParentForNewFolder, setSelectedParentForNewFolder] = useState<string | null>(null);

  const [isDriveSyncModalOpen, setIsDriveSyncModalOpen] = useState(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);

  // Multi-select & Folder / File Delete states
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [folderPendingDelete, setFolderPendingDelete] = useState<CADFolder | null>(null);
  const [filePendingDelete, setFilePendingDelete] = useState<CADMetadataIndexItem | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deleteFolderWithContents, setDeleteFolderWithContents] = useState(false);

  // Settings Folder Filter Search
  const [folderSearchQuery, setFolderSearchQuery] = useState("");

  // Load Folders & Index on Mount & Refresh
  const reloadData = () => {
    const loadedFolders = getStoredCADFolders();
    const loadedIndex = getCADMetadataIndex();
    setFolders(loadedFolders);
    setIndexItems(loadedIndex);
  };

  useEffect(() => {
    reloadData();

    // Instant local/cloud update listeners
    const handleInstantUpdate = () => {
      reloadData();
    };

    window.addEventListener("vasthusilpy_cad_vault_update", handleInstantUpdate);
    window.addEventListener("vasthusilpy_storage_update", handleInstantUpdate);
    window.addEventListener("vasthusilpy_realtime_cloud_sync", handleInstantUpdate);
    window.addEventListener("vasthusilpy_backup_restored", handleInstantUpdate);
    window.addEventListener("storage", handleInstantUpdate);
    window.addEventListener("focus", handleInstantUpdate);

    // Cross-tab BroadcastChannel listener for instant zero-latency sync
    const bc = getBroadcastChannel();
    const handleBroadcast = (event: MessageEvent) => {
      if (
        event.data?.type === "CAD_FILES_UPDATED" ||
        event.data?.type === "CAD_FOLDERS_UPDATED" ||
        event.data?.type === "CLOUD_AUTOSYNC_APPLIED" ||
        event.data?.type === "STORAGE_SYNC"
      ) {
        reloadData();
      }
    };
    if (bc) {
      bc.addEventListener("message", handleBroadcast);
    }

    // Also connect to WebData SSE if available
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/web-data/sse");
      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "CAD_FILES_UPDATED" || msg.type === "CAD_FOLDERS_UPDATED" || msg.type === "INIT") {
            reloadData();
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      window.removeEventListener("vasthusilpy_cad_vault_update", handleInstantUpdate);
      window.removeEventListener("vasthusilpy_storage_update", handleInstantUpdate);
      window.removeEventListener("vasthusilpy_realtime_cloud_sync", handleInstantUpdate);
      window.removeEventListener("vasthusilpy_backup_restored", handleInstantUpdate);
      window.removeEventListener("storage", handleInstantUpdate);
      window.removeEventListener("focus", handleInstantUpdate);
      if (bc) {
        bc.removeEventListener("message", handleBroadcast);
      }
      if (es) es.close();
    };
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

  // Category file counts & storage size
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; bytes: number }> = {
      PLAN: { count: 0, bytes: 0 },
      "3D": { count: 0, bytes: 0 },
      ESTIMATE: { count: 0, bytes: 0 },
      SURVEY: { count: 0, bytes: 0 },
      DOCUMENTS: { count: 0, bytes: 0 }
    };
    indexItems.forEach((item) => {
      const cat = (item.category as CADCategory) || "PLAN";
      if (stats[cat]) {
        stats[cat].count += 1;
        stats[cat].bytes += item.fileSize || 0;
      }
    });
    return stats;
  }, [indexItems]);

  const totalVaultSize = useMemo(() => {
    return indexItems.reduce((sum, item) => sum + (item.fileSize || 0), 0);
  }, [indexItems]);

  const starredCount = useMemo(() => {
    return indexItems.filter((i) => i.isStarred).length;
  }, [indexItems]);

  // Map subTab to Category if it's one of the 5 categories
  const activeCategoryForTab: CADCategory | null = useMemo(() => {
    if (currentSubTab === "vault_plan") return "PLAN";
    if (currentSubTab === "vault_3d") return "3D";
    if (currentSubTab === "vault_estimate") return "ESTIMATE";
    if (currentSubTab === "vault_survey") return "SURVEY";
    if (currentSubTab === "vault_documents") return "DOCUMENTS";
    return null;
  }, [currentSubTab]);

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
      // 1. Tab-level Category Filter
      if (activeCategoryForTab && item.category !== activeCategoryForTab) {
        return false;
      }

      // 2. Folder filter
      if (activeFolderId && item.folderId !== activeFolderId) {
        if (!isFolderDescendantOf(item.folderId, activeFolderId)) {
          return false;
        }
      }

      // 3. Starred filter
      if (starredOnly && !item.isStarred) {
        return false;
      }

      // 4. Format filter
      if (formatFilter !== "ALL" && item.fileType !== formatFilter) {
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

      // 8. Multi-Parameter Text Search
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
    activeCategoryForTab,
    activeFolderId,
    starredOnly,
    formatFilter,
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
    setPdfViewingFile(fullRecord);
    setIsPdfModalOpen(true);
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
      setUploadDefaultCategory(fullRecord.category || activeCategoryForTab || "PLAN");
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

  const handleToggleSelectFile = (fileId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSelectAllFiles = (items: CADMetadataIndexItem[]) => {
    const itemIds = items.map((i) => i.id);
    const allSelected = itemIds.length > 0 && itemIds.every((id) => selectedFileIds.includes(id));
    if (allSelected) {
      setSelectedFileIds((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      setSelectedFileIds((prev) => Array.from(new Set([...prev, ...itemIds])));
    }
  };

  const handleBulkDeleteSelected = () => {
    if (selectedFileIds.length === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    selectedFileIds.forEach((id) => deleteCADDrawingRecord(id));
    setSelectedFileIds([]);
    setIsBulkDeleteModalOpen(false);
    reloadData();
  };

  const handleConfirmDeleteFolder = (folder: CADFolder, withContents: boolean) => {
    const result = deleteCADFolder(folder.id, withContents);
    if (result.success) {
      if (activeFolderId === folder.id) {
        setActiveFolderId(null);
      }
      setFolderPendingDelete(null);
      reloadData();
    }
  };

  const handleDeleteFile = (item: CADMetadataIndexItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFilePendingDelete(item);
  };

  const handleConfirmDeleteFile = (fileId: string) => {
    deleteCADDrawingRecord(fileId);
    setSelectedFileIds((prev) => prev.filter((id) => id !== fileId));
    setFilePendingDelete(null);
    reloadData();
  };

  const handleQuickDownload = (item: CADMetadataIndexItem, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadRecordFile(item);
  };

  // Vault Drag and Drop state
  const [isVaultDragActive, setIsVaultDragActive] = useState(false);
  const [droppedUploadFiles, setDroppedUploadFiles] = useState<File[] | null>(null);

  const handleVaultDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isVaultDragActive) {
      setIsVaultDragActive(true);
    }
  };

  const handleVaultDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsVaultDragActive(false);
  };

  const handleVaultDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVaultDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setDroppedUploadFiles(filesArray);
      setEditingFile(null);
      setUploadDefaultCategory(activeCategoryForTab || "PLAN");
      setIsEditModalOpen(true);
    }
  };

  // Open upload modal pre-selected to specific category
  const handleOpenUpload = (cat?: CADCategory) => {
    setDroppedUploadFiles(null);
    setEditingFile(null);
    setUploadDefaultCategory(cat || activeCategoryForTab || "PLAN");
    setIsEditModalOpen(true);
  };

  // Wipe All Storage Confirmation
  const handleWipeAll = () => {
    resetAndWipeCadStorage();
    reloadData();
    setActiveFolderId(null);
    setIsWipeConfirmOpen(false);
  };

  // Active Category Meta
  const activeCategoryMeta = useMemo(() => {
    if (!activeCategoryForTab) return null;
    return VAULT_CATEGORIES.find((c) => c.id === activeCategoryForTab) || null;
  }, [activeCategoryForTab]);

  return (
    <div
      onDragOver={handleVaultDragOver}
      onDragLeave={handleVaultDragLeave}
      onDrop={handleVaultDrop}
      className="space-y-6 animate-in fade-in duration-200 relative"
    >
      {/* Full-Vault Drag & Drop Overlay */}
      {isVaultDragActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-dashed border-cyan-400 pointer-events-none animate-in fade-in duration-150">
          <div className="p-8 rounded-3xl bg-slate-900 border border-cyan-500 shadow-2xl flex flex-col items-center text-center space-y-3 max-w-md">
            <Upload className="w-14 h-14 text-cyan-400 animate-bounce" />
            <div className="text-lg font-bold text-white font-mono">Drop file(s) here to upload to Vault</div>
            <p className="text-xs text-slate-300 font-mono">
              Files will be imported cleanly with no unwanted default values
            </p>
          </div>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                DATA STORAGE VAULT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono font-bold flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                Google Drive Ready
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              Data Storage Vault & Drawing Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-mono">
              Centralized vault with 5 dedicated categories: 1. PLAN, 2. 3D, 3. ESTIMATE, 4. SURVEY, 5. DOCUMENTS, plus comprehensive folder management & Drive sync.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenUpload()}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Upload File</span>
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
              title="Synchronize Vault with Google Drive"
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-slate-800 to-cyan-950 hover:from-slate-700 hover:to-cyan-900 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 border border-cyan-800/60 cursor-pointer transition-colors shadow-sm"
            >
              <Cloud className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">Drive Sync</span>
            </button>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent("vasthusilpy_open_backup_modal", { detail: { tab: "backup" } }))}
              title="Backup & Restore Data Storage Vault and all Office Data"
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-950 to-slate-900 hover:from-purple-900 hover:to-slate-800 text-purple-200 hover:text-white text-xs font-mono font-bold flex items-center gap-2 border border-purple-600/50 cursor-pointer transition-colors shadow-sm"
            >
              <Database className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Vault Backup</span>
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
              <div className="text-[10px] font-mono text-slate-400 uppercase">Total Folders</div>
              <div className="text-base font-black text-white font-mono">{folders.length} Folders</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Total Records</div>
              <div className="text-base font-black text-white font-mono">{indexItems.length} Files</div>
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
              <Star className="w-4 h-4 fill-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Starred Priority</div>
              <div className="text-base font-black text-emerald-300 font-mono">{starredCount} Files</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-TABS NAVIGATION BAR */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex items-center gap-2 overflow-x-auto shadow-lg backdrop-blur-md sticky top-16 z-30">
        {/* Dashboard Sub-Tab */}
        <button
          onClick={() => handleSwitchTab("vault_dashboard")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            currentSubTab === "vault_dashboard"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/60 border border-cyan-400/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/70"
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-cyan-300" />
          <span>Dashboard</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-950/80 text-[10px] text-cyan-300 font-mono border border-cyan-800/50">
            {indexItems.length}
          </span>
        </button>

        {/* 5 Categories Sub-Tabs */}
        {VAULT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = categoryStats[cat.id]?.count || 0;
          const isActive = currentSubTab === cat.tabId;

          return (
            <button
              key={cat.id}
              onClick={() => handleSwitchTab(cat.tabId)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/60 border border-cyan-400/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : cat.color}`} />
              <span>{cat.number}. {cat.title}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-950 text-slate-400 border border-slate-800"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Settings & Folders Sub-Tab */}
        <button
          onClick={() => handleSwitchTab("vault_settings")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ml-auto ${
            currentSubTab === "vault_settings"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60 border border-purple-400/40"
              : "text-purple-300/80 hover:text-white hover:bg-slate-800/70"
          }`}
        >
          <Settings className="w-4 h-4 text-purple-300" />
          <span>Settings & Folders</span>
          <span className="px-1.5 py-0.5 rounded-full bg-purple-950/80 text-[10px] text-purple-300 font-mono border border-purple-800/50">
            CONFIG
          </span>
        </button>
      </div>

      {/* Drag & Drop Quick Dropzone Banner */}
      <div
        onClick={() => handleOpenUpload()}
        onDragOver={handleVaultDragOver}
        onDrop={handleVaultDrop}
        className={`border-2 border-dashed rounded-2xl p-3.5 sm:p-4 text-center cursor-pointer transition-all ${
          isVaultDragActive
            ? "border-cyan-400 bg-cyan-950/60 shadow-xl shadow-cyan-950/50 scale-[1.008]"
            : "border-slate-800 hover:border-cyan-500/60 bg-slate-900/40 hover:bg-slate-900/70"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shrink-0">
              <Upload className={`w-4 h-4 ${isVaultDragActive ? "animate-bounce text-cyan-300" : ""}`} />
            </div>
            <div className="text-left">
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <span>{isVaultDragActive ? "Release to drop file(s) into Vault" : "Drag & Drop files anywhere on Vault to upload"}</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800/60 font-normal">
                  No default values added
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                Supports AutoCAD (.dwg, .dxf), Drawings (.pdf), 3D Renderings (.png, .jpg), and Docs — all fields remain empty unless you specify them
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenUpload();
            }}
            className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-mono font-bold whitespace-nowrap transition-colors"
          >
            Browse / Upload
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW A: VAULT DASHBOARD (vault_dashboard)
         ========================================================================= */}
      {currentSubTab === "vault_dashboard" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 5 Category Interactive Cards */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Vault Categories Overview
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Select a category to browse files or upload
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {VAULT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const stats = categoryStats[cat.id] || { count: 0, bytes: 0 };

                return (
                  <div
                    key={cat.id}
                    onClick={() => handleSwitchTab(cat.tabId)}
                    className={`group bg-slate-900 hover:bg-slate-850 border ${cat.borderColor} rounded-3xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${cat.bgBadge}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono font-bold">
                          CAT #{cat.number}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                        {cat.number}. {cat.title}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                        {cat.titleMl}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-2 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-white font-mono">
                          {stats.count} {stats.count === 1 ? "File" : "Files"}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatBytes(stats.bytes)}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenUpload(cat.id);
                        }}
                        title={`Upload to ${cat.title}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Folder Directory Quick Access */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Vault Folder Directories
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFolderToEdit(null);
                    setSelectedParentForNewFolder(null);
                    setIsFolderModalOpen(true);
                  }}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Folder</span>
                </button>
                <button
                  onClick={() => handleSwitchTab("vault_settings")}
                  className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer ml-2"
                >
                  <span>Manage in Settings →</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {folders.map((f) => {
                const count = folderStats[f.id] || 0;
                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      setActiveFolderId(f.id);
                      handleSwitchTab("vault_plan");
                    }}
                    className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0"
                        style={{
                          backgroundColor: `${f.color || "#38bdf8"}15`,
                          borderColor: `${f.color || "#38bdf8"}40`,
                          color: f.color || "#38bdf8"
                        }}
                      >
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white group-hover:text-cyan-300 truncate font-mono">
                          {f.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-mono">
                          {f.path}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderToEdit(f);
                          setIsFolderModalOpen(true);
                        }}
                        title={`Edit folder "${f.name}"`}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderPendingDelete(f);
                        }}
                        title={`Delete folder "${f.name}"`}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] font-mono text-slate-400 border border-slate-800 shrink-0">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Drawings & Files Across Vault */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Recently Updated Vault Files
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Latest records across all categories
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-3.5">Drawing / Record</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Folder</th>
                    <th className="p-3.5">Owner / Client</th>
                    <th className="p-3.5">Format & Size</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {indexItems.slice(0, 8).map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenFile(item)}
                      className="hover:bg-slate-850/80 cursor-pointer transition-colors group"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
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
                            <div className="text-[10px] text-slate-500">{item.facing || item.bedrooms || item.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-cyan-300 border border-slate-800 text-[10px] font-bold">
                          {item.category || "PLAN"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-[10px]">
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
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-bold text-[10px]">
                          {item.fileType}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1.5">
                          {formatBytes(item.fileSize)}
                        </span>
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
                          <button
                            onClick={(e) => handleDeleteFile(item, e)}
                            title="Delete Drawing"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: 5 CATEGORY TABS (PLAN, 3D, ESTIMATE, SURVEY, DOCUMENTS)
         ========================================================================= */}
      {activeCategoryForTab && activeCategoryMeta && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Category Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${activeCategoryMeta.bgBadge}`}>
                <activeCategoryMeta.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white font-mono">
                    {activeCategoryMeta.number}. {activeCategoryMeta.title}
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                    {activeCategoryMeta.titleMl}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {activeCategoryMeta.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenUpload(activeCategoryForTab)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-950"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Upload to {activeCategoryMeta.title}</span>
              </button>
            </div>
          </div>

          {/* Folder Navigation Ribbon */}
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
                  <>
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
                    <button
                      onClick={() => {
                        setFolderPendingDelete(activeFolder);
                      }}
                      className="text-[11px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-bold bg-rose-950/40 hover:bg-rose-950/80 px-2 py-1 rounded-lg border border-rose-900/60 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Folder</span>
                    </button>
                  </>
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
                  <span>+ New Folder</span>
                </button>
              </div>
            </div>

            {/* Folder Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
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
                  {categoryStats[activeCategoryForTab]?.count || 0}
                </span>
              </button>

              {folders.map((folder) => {
                const count = indexItems.filter(
                  (i) => i.folderId === folder.id && i.category === activeCategoryForTab
                ).length;
                const isSelected = activeFolderId === folder.id;
                const isSubfolder = Boolean(folder.parentId);

                return (
                  <div
                    key={folder.id}
                    className={`inline-flex items-center rounded-xl text-xs font-mono font-bold transition-all border group/fbadge ${
                      isSelected
                        ? "bg-slate-800 text-white shadow-md border-cyan-500"
                        : "bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <button
                      onClick={() => setActiveFolderId(folder.id)}
                      className="px-3 py-2 flex items-center gap-2 cursor-pointer"
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFolderPendingDelete(folder);
                      }}
                      title={`Delete folder "${folder.name}"`}
                      className="pr-2.5 pl-1 py-2 text-slate-500 hover:text-rose-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Active Path */}
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

          {/* Search & Filter Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeCategoryMeta.title} files by Owner, Mobile, Facing, BHK, Location, Vasthu Chuttu...`}
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

              <div className="flex items-center gap-2">
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value as CADFileType | "ALL")}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Formats</option>
                  <option value="PDF">Architectural PDF</option>
                  <option value="IMAGE">Images & 3D Renderings</option>
                  <option value="DWG">AutoCAD DWG</option>
                  <option value="DXF">AutoCAD DXF</option>
                  <option value="DOC">Word & Text Documents</option>
                  <option value="EXCEL">Excel & BOQ Sheets</option>
                </select>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showAdvancedFilters || facingFilter || bedroomFilter || floorFilter
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                      : "bg-slate-950 border-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filters</span>
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

            {/* Expandable Advanced Filters */}
            {showAdvancedFilters && (
              <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                    <span>Starred</span>
                  </button>

                  {(facingFilter || bedroomFilter || floorFilter || starredOnly || searchQuery) && (
                    <button
                      onClick={() => {
                        setFacingFilter("");
                        setBedroomFilter("");
                        setFloorFilter("");
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

          {/* Results Summary & Sorting */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <div>
              Showing <strong className="text-white">{filteredItems.length}</strong> {activeCategoryMeta.title} files
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

          {/* Files Display: Grid or Table */}
          {filteredItems.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4">
                <activeCategoryMeta.icon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white font-mono mb-1">
                No {activeCategoryMeta.title} Records Found
              </h3>
              <p className="text-xs text-slate-400 font-mono max-w-md mx-auto mb-6">
                Upload a new record to {activeCategoryMeta.title}, adjust your active folder, or clear search keywords.
              </p>
              <button
                onClick={() => handleOpenUpload(activeCategoryForTab)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload to {activeCategoryMeta.title}</span>
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div className="space-y-4">
              {filteredItems.length > 0 && (
                <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllFiles(filteredItems)}
                      className="flex items-center gap-1.5 hover:text-cyan-300 cursor-pointer"
                    >
                      {filteredItems.every((i) => selectedFileIds.includes(i.id)) ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span>Select All ({filteredItems.length})</span>
                    </button>
                  </div>
                  {selectedFileIds.length > 0 && (
                    <div className="text-cyan-300 font-bold">
                      {selectedFileIds.length} item(s) selected
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredItems.map((item) => {
                  const isPdf = item.fileType === "PDF";
                  const isImage = item.fileType === "IMAGE";
                  const isSelected = selectedFileIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenFile(item)}
                      className={`group bg-slate-900 hover:bg-slate-850 border rounded-3xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "border-cyan-500 ring-1 ring-cyan-500/50 bg-slate-900/90"
                          : "border-slate-800 hover:border-cyan-500/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => handleToggleSelectFile(item.id, e)}
                              className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                                isSelected
                                  ? "text-cyan-400 bg-cyan-950/80"
                                  : "text-slate-600 hover:text-slate-400 bg-slate-950/60"
                              }`}
                              title={isSelected ? "Deselect" : "Select"}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>

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

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleToggleStar(item.id, e)}
                              className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  item.isStarred ? "fill-amber-400 text-amber-400" : ""
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteFile(item, e)}
                              title="Delete Drawing"
                              className="p-1.5 rounded-xl bg-slate-950 hover:bg-rose-600 text-slate-500 hover:text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Owner & Details */}
                        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs font-mono mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <User className="w-3 h-3 text-cyan-400" />
                              Owner / Client:
                            </span>
                            <span className="font-bold text-white truncate max-w-[150px]">
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

                          {item.location && (
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                              <span className="text-[10px] text-slate-500">Location:</span>
                              <span className="text-cyan-300 truncate max-w-[160px] font-bold">
                                {item.location}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Architectural Specs Badges (Facing, BHK, Floors) */}
                        {(item.facing || item.bedrooms || item.floors || item.builtUpArea) && (
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
                        )}

                        {/* Vasthu Chuttu Badge */}
                        {item.vasthuChuttu && (
                          <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-[11px] font-mono mb-3 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-400">വാസ്തു ചുറ്റ്:</span>
                            <span className="font-bold truncate max-w-[190px]">{item.vasthuChuttu}</span>
                          </div>
                        )}

                        {/* Auto Keywords Badges */}
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

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="text-[10px] font-mono text-slate-500">
                          {formatBytes(item.fileSize)}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFile(item);
                            }}
                            title="Open CAD / PDF Viewer"
                            className="p-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

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

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenShare(item);
                            }}
                            title="Share & QR Code"
                            className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleQuickDownload(item, e)}
                            title="Download"
                            className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(item);
                            }}
                            title="Edit"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteFile(item, e)}
                            title="Delete"
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
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="p-3.5 w-10">
                        <button
                          type="button"
                          onClick={() => handleSelectAllFiles(filteredItems)}
                          className="text-slate-400 hover:text-cyan-300 cursor-pointer flex items-center justify-center"
                          title="Select / Deselect All"
                        >
                          {filteredItems.length > 0 && filteredItems.every((i) => selectedFileIds.includes(i.id)) ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="p-3.5">Drawing / Record</th>
                      <th className="p-3.5">Folder</th>
                      <th className="p-3.5">Owner & Mobile</th>
                      <th className="p-3.5">Facing & Specs</th>
                      <th className="p-3.5">വാസ്തു ചുറ്റ്</th>
                      <th className="p-3.5">Format / Size</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredItems.map((item) => {
                      const isSelected = selectedFileIds.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleOpenFile(item)}
                          className={`hover:bg-slate-850/80 cursor-pointer transition-colors group ${
                            isSelected ? "bg-slate-800/60" : ""
                          }`}
                        >
                          <td className="p-3.5 w-10" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleToggleSelectFile(item.id, e)}
                              className={`cursor-pointer flex items-center justify-center ${
                                isSelected ? "text-cyan-400" : "text-slate-600 hover:text-slate-400"
                              }`}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
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
                                <div className="text-[10px] text-slate-400">{item.location}</div>
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
                              <button
                                onClick={(e) => handleDeleteFile(item, e)}
                                title="Delete"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white"
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

          {/* Floating Bulk Action Bar */}
          {selectedFileIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 text-xs font-mono animate-in slide-in-from-bottom-5">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <CheckSquare className="w-4 h-4" />
                <span>{selectedFileIds.length} drawing(s) selected</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <button
                type="button"
                onClick={handleBulkDeleteSelected}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-rose-950 cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFileIds([])}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
              >
                Deselect All
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW C: SETTINGS & FOLDER MANAGEMENT TAB (vault_settings)
         ========================================================================= */}
      {currentSubTab === "vault_settings" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/80 text-[10px] font-mono font-bold">
                    CONFIGURATION & FOLDER MANAGER
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white font-mono">
                  Vault Settings & Folder Administration
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1 max-w-xl">
                  Add new folders, edit folder hierarchies & colors, delete folders, inspect storage metrics, and trigger Google Drive synchronization.
                </p>
              </div>

              <button
                onClick={() => {
                  setFolderToEdit(null);
                  setSelectedParentForNewFolder(null);
                  setIsFolderModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-950 cursor-pointer self-start sm:self-center shrink-0"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Add New Folder</span>
              </button>
            </div>
          </div>

          {/* 1. FOLDER MANAGEMENT SECTION (Add, Edit, Delete Folders) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-950 text-purple-400 border border-purple-800/60 flex items-center justify-center">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Vault Folder Directories ({folders.length})
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Manage hierarchical organization (VISHNU, DEEPAK, DIBIN, and custom subfolders).
                  </div>
                </div>
              </div>

              {/* Folder Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={folderSearchQuery}
                  onChange={(e) => setFolderSearchQuery(e.target.value)}
                  placeholder="Filter folders..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Folder Table / List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-3.5">Folder Name & Path</th>
                    <th className="p-3.5">Color Tag</th>
                    <th className="p-3.5">Parent Directory</th>
                    <th className="p-3.5">Files Stored</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {folders
                    .filter((f) =>
                      folderSearchQuery.trim()
                        ? f.name.toLowerCase().includes(folderSearchQuery.toLowerCase()) ||
                          f.path.toLowerCase().includes(folderSearchQuery.toLowerCase())
                        : true
                    )
                    .map((folder) => {
                      const count = folderStats[folder.id] || 0;
                      const parent = folders.find((p) => p.id === folder.parentId);

                      return (
                        <tr key={folder.id} className="hover:bg-slate-850/60 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0"
                                style={{
                                  backgroundColor: `${folder.color || "#38bdf8"}15`,
                                  borderColor: `${folder.color || "#38bdf8"}40`,
                                  color: folder.color || "#38bdf8"
                                }}
                              >
                                <Folder className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{folder.name}</span>
                                  {folder.isSystemDefault && (
                                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px]">
                                      DEFAULT
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">{folder.path}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-full border border-white/20"
                                style={{ backgroundColor: folder.color || "#38bdf8" }}
                              />
                              <span className="text-[11px] text-slate-300">{folder.color || "#38bdf8"}</span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className="text-slate-400">
                              {parent ? `📁 ${parent.name}` : <em className="text-slate-600">Root Directory</em>}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-bold">
                              {count} {count === 1 ? "file" : "files"}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Add Subfolder */}
                              <button
                                onClick={() => {
                                  setFolderToEdit(null);
                                  setSelectedParentForNewFolder(folder.id);
                                  setIsFolderModalOpen(true);
                                }}
                                title="Add Subfolder here"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white"
                              >
                                <FolderPlus className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Folder */}
                              <button
                                onClick={() => {
                                  setFolderToEdit(folder);
                                  setIsFolderModalOpen(true);
                                }}
                                title="Edit Folder Details"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Folder */}
                              <button
                                onClick={() => {
                                  setFolderPendingDelete(folder);
                                }}
                                title="Delete Folder"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white"
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

          {/* 2. STORAGE METRICS BREAKDOWN BY CATEGORY */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  Storage Allocation by Category
                </h3>
                <div className="text-[11px] text-slate-400 font-mono">
                  Real-time breakdown of storage volume and record density across 5 categories.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {VAULT_CATEGORIES.map((cat) => {
                const stats = categoryStats[cat.id] || { count: 0, bytes: 0 };
                const pct = totalVaultSize > 0 ? Math.round((stats.bytes / totalVaultSize) * 100) : 0;

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white">{cat.number}. {cat.title}</span>
                      <span className="text-cyan-400 font-bold">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                      <span>{stats.count} files</span>
                      <span className="text-slate-200">{formatBytes(stats.bytes)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. GOOGLE DRIVE SYNC & CLOUD BACKUP */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Google Drive Cloud Storage Sync
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Synchronize your local CAD storage vault, DXF files, and architectural PDFs with your Google Drive root folder.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDriveSyncModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer self-start sm:self-center shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Open Drive Sync Center</span>
              </button>
            </div>
          </div>

          {/* 4. DANGER ZONE / RESET */}
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Reset Vault & Delete All Settings
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Clear custom folders, purge uploaded files, and reset to clean starter root folders: /VISHNU, /DEEPAK, and /DIBIN.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsWipeConfirmOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-center shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset & Wipe Storage</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ALL ASSOCIATED MODALS
         ========================================================================= */}

      {/* File Edit / Upload Modal */}
      {isEditModalOpen && (
        <CadFileEditModal
          file={editingFile}
          defaultFolderId={activeFolderId}
          defaultCategory={uploadDefaultCategory}
          initialFiles={droppedUploadFiles}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setDroppedUploadFiles(null);
          }}
          onSaved={() => {
            reloadData();
            setIsEditModalOpen(false);
            setDroppedUploadFiles(null);
          }}
          onDelete={(fileId) => {
            deleteCADDrawingRecord(fileId);
            reloadData();
            setIsEditModalOpen(false);
            setDroppedUploadFiles(null);
          }}
          userEmail={userEmail}
        />
      )}

      {/* Document, PDF & Image Viewer Modal (No 2D CAD Canvas) */}
      {isPdfModalOpen && pdfViewingFile && (
        <PdfViewerModal
          file={pdfViewingFile}
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          onOpenShare={(fileToShare) => {
            setSharingFile(fileToShare);
            setIsShareModalOpen(true);
          }}
          onDelete={(fileId) => {
            deleteCADDrawingRecord(fileId);
            reloadData();
            setIsPdfModalOpen(false);
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

      {/* Dedicated Folder Delete Modal */}
      {folderPendingDelete && (
        <FolderDeleteModal
          folder={folderPendingDelete}
          isOpen={Boolean(folderPendingDelete)}
          onClose={() => setFolderPendingDelete(null)}
          onConfirmDelete={(folderId, deleteContents) => {
            deleteCADFolder(folderId, deleteContents);
            if (activeFolderId === folderId) {
              setActiveFolderId(null);
            }
            setFolderPendingDelete(null);
            reloadData();
          }}
        />
      )}

      {/* Dedicated Single File Delete Modal */}
      {filePendingDelete && (
        <FileDeleteModal
          file={filePendingDelete}
          isOpen={Boolean(filePendingDelete)}
          onClose={() => setFilePendingDelete(null)}
          onConfirmDelete={() => {
            handleConfirmDeleteFile(filePendingDelete.id);
          }}
        />
      )}

      {/* Dedicated Bulk File Delete Modal */}
      {isBulkDeleteModalOpen && (
        <FileDeleteModal
          isBulk={true}
          selectedCount={selectedFileIds.length}
          bulkFiles={indexItems.filter((i) => selectedFileIds.includes(i.id))}
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirmDelete={handleConfirmBulkDelete}
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
