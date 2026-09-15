import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  EstimateProject,
  EstimateItem,
  EstimateAppendix,
  EstimateBlock,
  MergedCellRange,
  INITIAL_PRESETS_ENGINEERS,
  normalizeProjectBlocks,
  generateAutoHeadlineNarrative,
  stripEr,
  isMainItemWithSubItems,
  recalculateAppendixItems
} from "../../data/estimateData";
import { numberToWordsIndian } from "../../utils/numberToWords";
import {
  FileSpreadsheet,
  QrCode,
  Paperclip,
  Printer,
  Bot,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Sparkles,
  Layers,
  Edit3,
  FileText,
  FolderKanban,
  Receipt,
  CornerDownRight,
  Search,
  ListPlus,
  Save,
  Loader2,
  Check,
  Award,
  Percent,
  Copy,
  LayoutDashboard,
  Grid,
  Table,
  Maximize2,
  X,
  Split,
  Columns,
  Minus,
  PlusCircle,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  MousePointer,
  TableProperties,
  Sliders
} from "lucide-react";
import { VerificationQRModal } from "./modals/VerificationQRModal";
import { AttachmentsModal } from "./modals/AttachmentsModal";
import { ExcelExportImportModal } from "./modals/ExcelExportImportModal";
import { ItemOfWorkSearchModal } from "./modals/ItemOfWorkSearchModal";
import { AiEstimateCloneModal } from "./modals/AiEstimateCloneModal";
import { EstimateSideDock } from "./EstimateSideDock";
import { triggerPrint } from "../../utils/printHelper";
import { useAuth } from "../../context/AuthContext";
import { canUseDigitalSignatures, AUTHORIZED_SIGNING_EMAILS } from "../../lib/firebase";

interface EstimateSheetTabProps {
  project: EstimateProject;
  allProjects?: EstimateProject[];
  onSelectProject?: (proj: EstimateProject) => void;
  onDuplicateProject?: (proj: EstimateProject) => void;
  onUpdateProject: (updated: EstimateProject) => void;
  onOpenAIAgent: () => void;
  onOpenStageCertificates?: () => void;
  onDeleteProject?: (id: string) => void;
  onGoToDashboard?: () => void;
  onConvertToProject?: (proj: EstimateProject) => void;
  onConvertToInvoice?: (proj: EstimateProject) => void;
  onOpenItemsOfWorkMaster?: () => void;
}

export const EstimateSheetTab: React.FC<EstimateSheetTabProps> = ({
  project: rawProject,
  allProjects = [],
  onSelectProject,
  onDuplicateProject,
  onUpdateProject,
  onOpenAIAgent,
  onOpenStageCertificates,
  onDeleteProject,
  onGoToDashboard,
  onConvertToProject,
  onConvertToInvoice,
  onOpenItemsOfWorkMaster
}) => {
  const { user, emailUser } = useAuth();
  const activeEmail = user?.email || emailUser?.email || "";
  const isAuthorizedSigner = canUseDigitalSignatures(activeEmail);

  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [selectedEngineerId, setSelectedEngineerId] = useState("dibin");

  // Modals
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isAiCloneModalOpen, setIsAiCloneModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTargetBlockIdx, setSearchTargetBlockIdx] = useState(0);
  const [searchTargetAppIdx, setSearchTargetAppIdx] = useState(0);
  const [editingQtyItemId, setEditingQtyItemId] = useState<string | null>(null);
  const [printQrUrl, setPrintQrUrl] = useState<string>("");
  const [isAiDockOpen, setIsAiDockOpen] = useState(false);

  // Cell Selection & Merge/Unmerge Spreadsheet State
  const [selectedCellRange, setSelectedCellRange] = useState<{
    blockIdx: number;
    appIdx: number;
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null>(null);
  const [isSelectingCells, setIsSelectingCells] = useState(false);
  const [isCellSelectMode, setIsCellSelectMode] = useState(false);

  // Save & Autosave Status
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<Date>(new Date());
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const saveTimeoutRef = React.useRef<any>(null);

  // Always work with normalized project blocks
  const normalizedProject = normalizeProjectBlocks(rawProject);

  useEffect(() => {
    if (normalizedProject) {
      const targetUrl = `${window.location.origin}/?verify=${normalizedProject.id}&hash=${normalizedProject.verificationHash}`;
      QRCode.toDataURL(targetUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setPrintQrUrl(url))
        .catch((err) => console.error("Error generating print QR code:", err));
    }
  }, [normalizedProject.id, normalizedProject.verificationHash]);

  const updateNormalized = (updated: EstimateProject) => {
    setSaveStatus("saving");
    const fresh = normalizeProjectBlocks(updated);
    onUpdateProject(fresh);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saved");
      setLastSavedTime(new Date());
    }, 600);
  };

  const handleManualSave = () => {
    setSaveStatus("saving");
    const fresh = normalizeProjectBlocks(normalizedProject);
    onUpdateProject(fresh);
    setTimeout(() => {
      setSaveStatus("saved");
      setLastSavedTime(new Date());
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }, 200);
  };

  // Keyboard shortcut for manual save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [normalizedProject]);


  const handleOpenSearchModal = (blockIdx: number, appIdx: number) => {
    setSearchTargetBlockIdx(blockIdx);
    setSearchTargetAppIdx(appIdx);
    setIsSearchModalOpen(true);
  };

  const handleIncludeItemsFromMaster = (newItems: EstimateItem[]) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[searchTargetBlockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[searchTargetAppIdx] };

    const combined = [...targetApp.items, ...newItems];
    const renumbered = renumberFloorItems(combined);
    const recalculated = recalculateAppendixItems(renumbered);
    targetApp.items = recalculated;
    apps[searchTargetAppIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[searchTargetBlockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleEngineerChange = (engId: string) => {
    setSelectedEngineerId(engId);
    const eng = INITIAL_PRESETS_ENGINEERS.find((e) => e.id === engId);
    if (eng) {
      updateNormalized({
        ...normalizedProject,
        preparedBy: eng.fullName,
        regNo: eng.regNo
      });
    }
  };

  const showEngineerDetails = normalizedProject.showEngineerDetails !== false;

  const handleToggleEngineerDetails = () => {
    updateNormalized({
      ...normalizedProject,
      showEngineerDetails: !showEngineerDetails
    });
  };

  // Client / Land specs auto update headline narrative
  const handleClientOrLandFieldChange = (field: keyof EstimateProject, value: any) => {
    const updated = {
      ...normalizedProject,
      [field]: value
    };
    // Auto generate narrative whenever client or land survey details change
    const autoNarrative = generateAutoHeadlineNarrative(updated);
    updated.headlineNarrative = autoNarrative;
    updateNormalized(updated);
  };

  const handleManualFieldChange = (field: keyof EstimateProject, value: any) => {
    updateNormalized({
      ...normalizedProject,
      [field]: value
    });
  };

  const handleAutoGenerateNarrative = () => {
    const narrative = generateAutoHeadlineNarrative(normalizedProject);
    handleManualFieldChange("headlineNarrative", narrative);
  };

  /* ---------------------------------------------------------------- border Block Operations ---------------------------------------------------------------- */
  const handleAddBlock = () => {
    const blocks = normalizedProject.blocks || [];
    const nextBlockNum = blocks.length + 1;

    const newBlock: EstimateBlock = {
      id: `block_${Date.now()}`,
      blockTitle: `BLOCK ${nextBlockNum}: PROPOSED STRUCTURE / OUTHOUSE`,
      totalAmount: 100000,
      appendices: [
        {
          id: `app_${Date.now()}_1`,
          title: `APPENDIX A - GROUND FLOOR`,
          subtitle: "Ground Floor Civil Work Specification",
          totalAmount: 100000,
          items: [
            {
              id: `item_${Date.now()}_1`,
              slNo: "1",
              particulars: "Site Clearance and Earthwork Excavation for foundation",
              nos: 1,
              length: 10,
              breadth: 1,
              depth: 1,
              quantity: 10,
              unit: "cum",
              rate: 10000,
              amount: 100000,
              remarks: "Foundation work"
            }
          ]
        }
      ]
    };

    updateNormalized({
      ...normalizedProject,
      blocks: [...blocks, newBlock]
    });
  };

  const handleDeleteBlock = (blockIdx: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    if (blocks.length <= 1) {
      return;
    }
    blocks.splice(blockIdx, 1);
    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleMoveBlock = (blockIdx: number, direction: "up" | "down") => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetIdx = direction === "up" ? blockIdx - 1 : blockIdx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const temp = blocks[blockIdx];
    blocks[blockIdx] = blocks[targetIdx];
    blocks[targetIdx] = temp;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleUpdateBlockTitle = (blockIdx: number, newTitle: string) => {
    const blocks = [...(normalizedProject.blocks || [])];
    blocks[blockIdx] = {
      ...blocks[blockIdx],
      blockTitle: newTitle
    };
    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  /* ---------------------------------------------------------------- Appendix (Floor) Operations ---------------------------------------------------------------- */
  const handleAddAppendix = (blockIdx: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const currentApps = targetBlock.appendices || [];

    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const letter = letters[currentApps.length % letters.length];

    const newApp: EstimateAppendix = {
      id: `app_${Date.now()}`,
      title: `APPENDIX ${letter} - FLOOR ${currentApps.length + 1}`,
      subtitle: `Floor ${currentApps.length + 1} Detailed Quantity Estimate`,
      totalAmount: 50000,
      items: [
        {
          id: `item_${Date.now()}`,
          slNo: "1",
          particulars: "Masonry work or concrete slab for floor level...",
          nos: 1,
          length: 5,
          breadth: 4,
          depth: 0.125,
          quantity: 2.5,
          unit: "cum",
          rate: 20000,
          amount: 50000,
          remarks: "Floor Slab"
        }
      ]
    };

    targetBlock.appendices = [...currentApps, newApp];
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleDeleteAppendix = (blockIdx: number, appIdx: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    if (targetBlock.appendices.length <= 1) {
      return;
    }
    targetBlock.appendices.splice(appIdx, 1);
    blocks[blockIdx] = targetBlock;
    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleMoveAppendix = (blockIdx: number, appIdx: number, direction: "up" | "down") => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const apps = [...targetBlock.appendices];
    const targetIdx = direction === "up" ? appIdx - 1 : appIdx + 1;
    if (targetIdx < 0 || targetIdx >= apps.length) return;

    const temp = apps[appIdx];
    apps[appIdx] = apps[targetIdx];
    apps[targetIdx] = temp;

    targetBlock.appendices = apps;
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleUpdateAppendixMeta = (blockIdx: number, appIdx: number, title: string, subtitle: string) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const apps = [...targetBlock.appendices];
    apps[appIdx] = {
      ...apps[appIdx],
      title,
      subtitle
    };
    targetBlock.appendices = apps;
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const renumberFloorItems = (items: EstimateItem[]): EstimateItem[] => {
    let mainIndex = 0;
    let subIndex = 0;

    return items.map((it) => {
      if (it.isSubItem) {
        const parentNum = mainIndex > 0 ? mainIndex : 1;
        const subLetter = String.fromCharCode(97 + (subIndex % 26)); // 'a', 'b', 'c', ...
        const suffix = subIndex >= 26 ? `${Math.floor(subIndex / 26) + 1}` : "";
        subIndex++;
        return {
          ...it,
          slNo: `${parentNum}.${subLetter}${suffix}`
        };
      } else {
        mainIndex++;
        subIndex = 0;
        return {
          ...it,
          slNo: `${mainIndex}`
        };
      }
    });
  };

  /* ---------------------------------------------------------------- Particulars of Work (Item & Sub Item) Operations ---------------------------------------------------------------- */
  const handleAddItem = (blockIdx: number, appIdx: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[appIdx] };

    const mainItemsCount = targetApp.items.filter((it) => !it.isSubItem).length;
    const nextMainSl = `${mainItemsCount + 1}`;

    const newItem: EstimateItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      slNo: nextMainSl,
      particulars: "New Particulars of Work item specification description...",
      nos: 1,
      length: 1,
      breadth: 1,
      depth: 1,
      quantity: 1,
      unit: "cum",
      rate: 1000,
      amount: 1000,
      remarks: "Specification",
      isSubItem: false
    };

    const renumbered = renumberFloorItems([...targetApp.items, newItem]);
    const recalculated = recalculateAppendixItems(renumbered);
    targetApp.items = recalculated;
    apps[appIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleAddSubItem = (blockIdx: number, appIdx: number, parentItemIdx?: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[appIdx] };
    const items = [...targetApp.items];

    let insertIdx = items.length;
    let defaultUnit = "cum";
    let defaultRate = 1000;
    let defaultNos = 1;
    let defaultL = 1;
    let defaultB = 1;
    let defaultD = 1;

    if (parentItemIdx !== undefined && parentItemIdx >= 0 && parentItemIdx < items.length) {
      // Find where to insert: after all existing sub-items of this parent
      let nextMainIdx = parentItemIdx + 1;
      while (nextMainIdx < items.length && items[nextMainIdx].isSubItem) {
        nextMainIdx++;
      }
      insertIdx = nextMainIdx;

      const parentItem = items[parentItemIdx];
      defaultUnit = parentItem.unit || "cum";
      defaultRate = parentItem.rate || 1000;
      if (parentItem.length) defaultL = parentItem.length;
      if (parentItem.breadth) defaultB = parentItem.breadth;
      if (parentItem.depth) defaultD = parentItem.depth;
    } else if (items.length > 0) {
      const lastItem = items[items.length - 1];
      defaultUnit = lastItem.unit || "cum";
      defaultRate = lastItem.rate || 1000;
    }

    const defaultQty = Number((defaultNos * defaultL * defaultB * defaultD).toFixed(4));
    const newSubItem: EstimateItem = {
      id: `subitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      slNo: "",
      particulars: "↳ Sub-item specification / measurement breakdown (e.g. Long wall, Short wall, Slab)...",
      nos: defaultNos,
      length: defaultL,
      breadth: defaultB,
      depth: defaultD,
      quantity: defaultQty,
      unit: defaultUnit,
      rate: defaultRate,
      amount: Math.round(defaultQty * defaultRate),
      remarks: "Sub-item",
      isSubItem: true
    };

    items.splice(insertIdx, 0, newSubItem);
    const renumbered = renumberFloorItems(items);
    const recalculated = recalculateAppendixItems(renumbered);
    targetApp.items = recalculated;
    apps[appIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleAddDeductionSubItem = (blockIdx: number, appIdx: number, parentItemIdx?: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[appIdx] };
    const items = [...targetApp.items];

    let insertIdx = items.length;
    let defaultUnit = "cum";
    let defaultRate = 1000;
    let defaultL = 1;
    let defaultB = 1;
    let defaultD = 1;

    if (parentItemIdx !== undefined && parentItemIdx >= 0 && parentItemIdx < items.length) {
      let nextMainIdx = parentItemIdx + 1;
      while (nextMainIdx < items.length && items[nextMainIdx].isSubItem) {
        nextMainIdx++;
      }
      insertIdx = nextMainIdx;

      const parentItem = items[parentItemIdx];
      defaultUnit = parentItem.unit || "cum";
      defaultRate = parentItem.rate || 1000;
      if (parentItem.length) defaultL = parentItem.length;
      if (parentItem.breadth) defaultB = parentItem.breadth;
      if (parentItem.depth) defaultD = parentItem.depth;
    } else if (items.length > 0) {
      const lastItem = items[items.length - 1];
      defaultUnit = lastItem.unit || "cum";
      defaultRate = lastItem.rate || 1000;
    }

    const defaultQty = -Number((1 * defaultL * defaultB * defaultD).toFixed(4));
    const newDeductSubItem: EstimateItem = {
      id: `subitem_deduct_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      slNo: "",
      particulars: "↳ Deduct: Openings / Voids (e.g. Doors D1, Windows W1)...",
      nos: -1,
      length: defaultL,
      breadth: defaultB,
      depth: defaultD,
      quantity: defaultQty,
      unit: defaultUnit,
      rate: 0,
      amount: 0,
      remarks: "Deduction",
      isSubItem: true,
      isDeduction: true
    };

    items.splice(insertIdx, 0, newDeductSubItem);
    const renumbered = renumberFloorItems(items);
    const recalculated = recalculateAppendixItems(renumbered);
    targetApp.items = recalculated;
    apps[appIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleToggleDeduction = (blockIdx: number, appIdx: number, itemIdx: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[appIdx] };
    const items = [...targetApp.items];
    const targetItem = { ...items[itemIdx] };

    const newIsDeduction = !targetItem.isDeduction;
    targetItem.isDeduction = newIsDeduction;

    if (newIsDeduction) {
      if (typeof targetItem.nos === "number" && targetItem.nos > 0) {
        targetItem.nos = -targetItem.nos;
      }
      if (typeof targetItem.quantity === "number" && targetItem.quantity > 0) {
        targetItem.quantity = -targetItem.quantity;
      }
    } else {
      if (typeof targetItem.nos === "number" && targetItem.nos < 0) {
        targetItem.nos = Math.abs(targetItem.nos);
      }
      if (typeof targetItem.quantity === "number" && targetItem.quantity < 0) {
        targetItem.quantity = Math.abs(targetItem.quantity);
      }
    }

    items[itemIdx] = targetItem;
    const recalculated = recalculateAppendixItems(items);
    targetApp.items = recalculated;
    apps[appIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleToggleSubItem = (blockIdx: number, appIdx: number, itemIdx: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[appIdx] };
    const items = [...targetApp.items];

    items[itemIdx] = {
      ...items[itemIdx],
      isSubItem: !items[itemIdx].isSubItem
    };

    const renumbered = renumberFloorItems(items);
    const recalculated = recalculateAppendixItems(renumbered);
    targetApp.items = recalculated;
    apps[appIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  // Global mouse up and keyboard listeners for spreadsheet cell selection
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelectingCells(false);
    };
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCellRange(null);
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const getMergeInfo = (
    mergedRanges: MergedCellRange[] | undefined,
    row: number,
    col: number
  ): {
    isCovered: boolean;
    isOrigin: boolean;
    colSpan: number;
    rowSpan: number;
    range?: MergedCellRange;
  } => {
    if (!mergedRanges || mergedRanges.length === 0) {
      return { isCovered: false, isOrigin: false, colSpan: 1, rowSpan: 1 };
    }

    for (const range of mergedRanges) {
      const minR = Math.min(range.startRow, range.endRow);
      const maxR = Math.max(range.startRow, range.endRow);
      const minC = Math.min(range.startCol, range.endCol);
      const maxC = Math.max(range.startCol, range.endCol);

      if (row >= minR && row <= maxR && col >= minC && col <= maxC) {
        const isOrigin = row === minR && col === minC;
        return {
          isCovered: true,
          isOrigin,
          colSpan: maxC - minC + 1,
          rowSpan: maxR - minR + 1,
          range
        };
      }
    }

    return { isCovered: false, isOrigin: false, colSpan: 1, rowSpan: 1 };
  };

  const handleCellMouseDown = (bIdx: number, aIdx: number, row: number, col: number, e: React.MouseEvent) => {
    // If Shift is pressed and previous selection in same appendix exists, expand range
    if (e.shiftKey && selectedCellRange && selectedCellRange.blockIdx === bIdx && selectedCellRange.appIdx === aIdx) {
      setSelectedCellRange({
        ...selectedCellRange,
        endRow: row,
        endCol: col
      });
      return;
    }

    setSelectedCellRange({
      blockIdx: bIdx,
      appIdx: aIdx,
      startRow: row,
      startCol: col,
      endRow: row,
      endCol: col
    });
    setIsSelectingCells(true);
  };

  const handleCellMouseEnter = (bIdx: number, aIdx: number, row: number, col: number) => {
    if (isSelectingCells && selectedCellRange && selectedCellRange.blockIdx === bIdx && selectedCellRange.appIdx === aIdx) {
      setSelectedCellRange((prev) => (prev ? { ...prev, endRow: row, endCol: col } : null));
    }
  };

  const handleMergeCells = (bIdx?: number, aIdx?: number) => {
    if (!selectedCellRange) {
      return;
    }
    const currentBlockIdx = bIdx !== undefined ? bIdx : selectedCellRange.blockIdx;
    const currentAppIdx = aIdx !== undefined ? aIdx : selectedCellRange.appIdx;

    if (selectedCellRange.blockIdx !== currentBlockIdx || selectedCellRange.appIdx !== currentAppIdx) {
      return;
    }

    const minRow = Math.min(selectedCellRange.startRow, selectedCellRange.endRow);
    const maxRow = Math.max(selectedCellRange.startRow, selectedCellRange.endRow);
    const minCol = Math.min(selectedCellRange.startCol, selectedCellRange.endCol);
    const maxCol = Math.max(selectedCellRange.startCol, selectedCellRange.endCol);

    if (minRow === maxRow && minCol === maxCol) {
      return;
    }

    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[currentBlockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[currentAppIdx] };
    const existingRanges = targetApp.mergedRanges || [];

    // Remove any overlapping ranges
    const filteredRanges = existingRanges.filter((r) => {
      const rMinR = Math.min(r.startRow, r.endRow);
      const rMaxR = Math.max(r.startRow, r.endRow);
      const rMinC = Math.min(r.startCol, r.endCol);
      const rMaxC = Math.max(r.startCol, r.endCol);
      const overlaps = !(rMaxR < minRow || rMinR > maxRow || rMaxC < minCol || rMinC > maxCol);
      return !overlaps;
    });

    const newRange: MergedCellRange = {
      id: `merge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startRow: minRow,
      endRow: maxRow,
      startCol: minCol,
      endCol: maxCol
    };

    targetApp.mergedRanges = [...filteredRanges, newRange];
    apps[currentAppIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[currentBlockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });

    setSelectedCellRange(null);
  };

  const handleMergeAcross = (bIdx?: number, aIdx?: number) => {
    if (!selectedCellRange) return;
    const currentBlockIdx = bIdx !== undefined ? bIdx : selectedCellRange.blockIdx;
    const currentAppIdx = aIdx !== undefined ? aIdx : selectedCellRange.appIdx;

    if (selectedCellRange.blockIdx !== currentBlockIdx || selectedCellRange.appIdx !== currentAppIdx) {
      return;
    }

    const minRow = Math.min(selectedCellRange.startRow, selectedCellRange.endRow);
    const maxRow = Math.max(selectedCellRange.startRow, selectedCellRange.endRow);
    const minCol = Math.min(selectedCellRange.startCol, selectedCellRange.endCol);
    const maxCol = Math.max(selectedCellRange.startCol, selectedCellRange.endCol);

    if (minCol === maxCol) return;

    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[currentBlockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[currentAppIdx] };
    let existingRanges = targetApp.mergedRanges || [];

    // Create a row-by-row merged range
    const newRanges: MergedCellRange[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      // Remove any overlapping ranges on this row
      existingRanges = existingRanges.filter((range) => {
        const rMinR = Math.min(range.startRow, range.endRow);
        const rMaxR = Math.max(range.startRow, range.endRow);
        const rMinC = Math.min(range.startCol, range.endCol);
        const rMaxC = Math.max(range.startCol, range.endCol);
        const overlaps = !(rMaxR < r || rMinR > r || rMaxC < minCol || rMinC > maxCol);
        return !overlaps;
      });

      newRanges.push({
        id: `merge_${Date.now()}_${r}_${Math.random().toString(36).substring(2, 6)}`,
        startRow: r,
        endRow: r,
        startCol: minCol,
        endCol: maxCol
      });
    }

    targetApp.mergedRanges = [...existingRanges, ...newRanges];
    apps[currentAppIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[currentBlockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });

    setSelectedCellRange(null);
  };

  const handleUpdateMergedValue = (bIdx: number, aIdx: number, rangeId: string, value: string) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[bIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[aIdx] };
    const existingRanges = targetApp.mergedRanges || [];

    targetApp.mergedRanges = existingRanges.map((r) => {
      if (r.id === rangeId) {
        return { ...r, mergedValue: value };
      }
      return r;
    });

    apps[aIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[bIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleQuickMergeNosToUnit = (bIdx: number, aIdx: number, rowIdx: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[bIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[aIdx] };
    const existingRanges = (targetApp.mergedRanges || []).filter((r) => {
      const rMinR = Math.min(r.startRow, r.endRow);
      const rMaxR = Math.max(r.startRow, r.endRow);
      const rMinC = Math.min(r.startCol, r.endCol);
      const rMaxC = Math.max(r.startCol, r.endCol);
      const overlaps = !(rMaxR < rowIdx || rMinR > rowIdx || rMaxC < 2 || rMinC > 7);
      return !overlaps;
    });

    const newRange: MergedCellRange = {
      id: `merge_nos_unit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startRow: rowIdx,
      endRow: rowIdx,
      startCol: 2, // NOS
      endCol: 7   // UNIT (NOS, L, B, D, QTY, UNIT)
    };

    targetApp.mergedRanges = [...existingRanges, newRange];
    apps[aIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[bIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
    setSelectedCellRange(null);
  };

  const handleSelectRowCols = (bIdx: number, aIdx: number, rowIdx: number, startCol: number, endCol: number) => {
    setSelectedCellRange({
      blockIdx: bIdx,
      appIdx: aIdx,
      startRow: rowIdx,
      startCol,
      endRow: rowIdx,
      endCol
    });
  };

  const handleUnmergeCells = (bIdx?: number, aIdx?: number, specificRangeId?: string) => {
    const currentBlockIdx = bIdx !== undefined ? bIdx : selectedCellRange?.blockIdx;
    const currentAppIdx = aIdx !== undefined ? aIdx : selectedCellRange?.appIdx;

    if (currentBlockIdx === undefined || currentAppIdx === undefined) return;

    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[currentBlockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[currentAppIdx] };
    const existingRanges = targetApp.mergedRanges || [];

    if (specificRangeId) {
      targetApp.mergedRanges = existingRanges.filter((r) => r.id !== specificRangeId);
    } else if (selectedCellRange) {
      const minRow = Math.min(selectedCellRange.startRow, selectedCellRange.endRow);
      const maxRow = Math.max(selectedCellRange.startRow, selectedCellRange.endRow);
      const minCol = Math.min(selectedCellRange.startCol, selectedCellRange.endCol);
      const maxCol = Math.max(selectedCellRange.startCol, selectedCellRange.endCol);

      targetApp.mergedRanges = existingRanges.filter((r) => {
        const rMinR = Math.min(r.startRow, r.endRow);
        const rMaxR = Math.max(r.startRow, r.endRow);
        const rMinC = Math.min(r.startCol, r.endCol);
        const rMaxC = Math.max(r.startCol, r.endCol);
        const overlaps = !(rMaxR < minRow || rMinR > maxRow || rMaxC < minCol || rMinC > maxCol);
        return !overlaps;
      });
    }

    apps[currentAppIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[currentBlockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });

    setSelectedCellRange(null);
  };

  const handleQuickMergeMeasurements = (bIdx: number, aIdx: number, rowIdx: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[bIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[aIdx] };
    const existingRanges = targetApp.mergedRanges || [];

    const newRange: MergedCellRange = {
      id: `merge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startRow: rowIdx,
      endRow: rowIdx,
      startCol: 2, // NOS
      endCol: 5   // D
    };

    targetApp.mergedRanges = [...existingRanges, newRange];
    apps[aIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[bIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
    setSelectedCellRange(null);
  };

  const handleQuickMergeRowHeader = (bIdx: number, aIdx: number, rowIdx: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[bIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[aIdx] };
    const existingRanges = targetApp.mergedRanges || [];

    const newRange: MergedCellRange = {
      id: `merge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startRow: rowIdx,
      endRow: rowIdx,
      startCol: 1, // Particulars
      endCol: 9   // Amount
    };

    targetApp.mergedRanges = [...existingRanges, newRange];
    apps[aIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[bIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
    setSelectedCellRange(null);
  };

  const handleDeleteItem = (blockIdx: number, appIdx: number, itemIdx: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[appIdx] };

    const remaining = targetApp.items.filter((_, idx) => idx !== itemIdx);
    const renumbered = renumberFloorItems(remaining);
    const recalculated = recalculateAppendixItems(renumbered);
    targetApp.items = recalculated;

    // Adjust merged ranges
    if (targetApp.mergedRanges) {
      targetApp.mergedRanges = targetApp.mergedRanges
        .filter((r) => r.startRow !== itemIdx && r.endRow !== itemIdx)
        .map((r) => ({
          ...r,
          startRow: r.startRow > itemIdx ? r.startRow - 1 : r.startRow,
          endRow: r.endRow > itemIdx ? r.endRow - 1 : r.endRow
        }));
    }

    apps[appIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleMoveItem = (blockIdx: number, appIdx: number, itemIdx: number, direction: "up" | "down") => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[appIdx] };
    const items = [...targetApp.items];

    const targetIdx = direction === "up" ? itemIdx - 1 : itemIdx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[itemIdx];
    items[itemIdx] = items[targetIdx];
    items[targetIdx] = temp;

    const renumbered = renumberFloorItems(items);
    const recalculated = recalculateAppendixItems(renumbered);
    targetApp.items = recalculated;

    apps[appIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleDuplicateItem = (blockIdx: number, appIdx: number, itemIdx: number) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[appIdx] };
    const items = [...targetApp.items];
    const itemToDup = items[itemIdx];
    if (!itemToDup) return;

    const duplicated: EstimateItem = {
      ...JSON.parse(JSON.stringify(itemToDup)),
      id: `item_dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      particulars: `${itemToDup.particulars} (Copy)`
    };

    items.splice(itemIdx + 1, 0, duplicated);
    const renumbered = renumberFloorItems(items);
    const recalculated = recalculateAppendixItems(renumbered);
    targetApp.items = recalculated;
    apps[appIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleItemChange = (
    blockIdx: number,
    appIdx: number,
    itemIdx: number,
    field: keyof EstimateItem,
    value: any
  ) => {
    const blocks = [...(normalizedProject.blocks || [])];
    const targetBlock = { ...blocks[blockIdx] };
    const apps = [...targetBlock.appendices];
    const targetApp = { ...apps[appIdx] };
    const items = [...targetApp.items];
    const item = { ...items[itemIdx] };

    // Set field value
    if (["nos", "length", "breadth", "depth"].includes(field)) {
      const numVal = value === "" ? 0 : parseFloat(value) || 0;
      (item as any)[field] = numVal;
      item.isManualQty = false;

      const rawNos = Number(item.nos) || 0;
      const l = Math.abs(Number(item.length) || 0);
      const b = Math.abs(Number(item.breadth) || 0);
      const d = Math.abs(Number(item.depth) || 0);

      const isDeduct = Boolean(
        item.isDeduction ||
        rawNos < 0 ||
        (typeof item.particulars === "string" && /^\s*(-|deduct|subtraction|less)\b/i.test(item.particulars))
      );
      item.isDeduction = isDeduct;

      const nosMag = Math.abs(rawNos);
      const effectiveNosMag = nosMag > 0 ? nosMag : (l > 0 || b > 0 || d > 0 ? 1 : 0);
      const sign = isDeduct ? -1 : 1;

      let mag = 0;
      if (l > 0 && b > 0 && d > 0) {
        mag = effectiveNosMag * l * b * d;
      } else if (l > 0 && b > 0) {
        mag = effectiveNosMag * l * b;
      } else if (l > 0) {
        mag = effectiveNosMag * l;
      } else if (nosMag > 0) {
        mag = nosMag;
      }
      item.quantity = Number((sign * mag).toFixed(4));
    } else if (field === "quantity") {
      item.isManualQty = true;
      const parsedQty = value === "" ? 0 : parseFloat(value) || 0;
      item.quantity = parsedQty;
      if (parsedQty < 0) {
        item.isDeduction = true;
      }
    } else if (field === "rate") {
      item.rate = item.isSubItem ? 0 : (value === "" ? 0 : parseFloat(value) || 0);
    } else {
      (item as any)[field] = value;
      if (field === "particulars" && typeof value === "string") {
        if (/^\s*(-|deduct|subtraction|less)\b/i.test(value)) {
          item.isDeduction = true;
        }
      }
    }

    // Sub-items CANNOT have rate or individual amount
    if (item.isSubItem) {
      item.rate = 0;
      item.amount = 0;
    } else {
      const q = Number(item.quantity) || 0;
      const r = Number(item.rate) || 0;
      item.amount = Math.round(q * r);
    }

    items[itemIdx] = item;
    const recalculated = recalculateAppendixItems(items);
    targetApp.items = recalculated;
    apps[appIdx] = targetApp;
    targetBlock.appendices = apps;
    blocks[blockIdx] = targetBlock;

    updateNormalized({
      ...normalizedProject,
      blocks
    });
  };

  const handleUnforeseenChange = (field: "unforeseenDescription" | "unforeseenQty" | "unforeseenAmount", val: any) => {
    updateNormalized({
      ...normalizedProject,
      [field]: field === "unforeseenAmount" ? Number(val) : val
    });
  };

  const handlePrint = () => {
    triggerPrint(
      `Vasthusilpy_Estimate_${normalizedProject.id}_${normalizedProject.clientName.replace(/\s+/g, "_")}`,
      "estimate-sheet-container"
    );
  };

  // Calculations summary
  const blocksList = normalizedProject.blocks || [];
  const totalBeforeContingency = blocksList.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const grandTotalCost = normalizedProject.grandTotal;
  const grandTotalInWords = numberToWordsIndian(grandTotalCost);

  return (
    <div id="estimate-sheet-container" className="space-y-6">
      {/* Save Notification Toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 font-mono text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white">Estimate Saved Successfully</div>
            <div className="text-[11px] text-emerald-300">
              {normalizedProject.id} ({normalizedProject.clientName}) saved to database & storage.
            </div>
          </div>
        </div>
      )}

      {/* Primary Layout: Side-by-Side Flex on Desktop (Zero Overlap between Estimate & Right Dock) */}
      <div className="flex flex-col lg:flex-row items-start gap-4 xl:gap-6 w-full">
        {/* Main Estimate Sheet Area */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Top Action Toolbar */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg sticky top-16 z-20 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          {onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Return to Estimate Dashboard with all estimates"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>All Estimates</span>
            </button>
          )}

          {/* Estimate Project Switcher Dropdown */}
          {allProjects && allProjects.length > 0 && onSelectProject ? (
            <select
              value={normalizedProject.id}
              onChange={(e) => {
                const found = allProjects.find((p) => p.id === e.target.value);
                if (found) onSelectProject(found);
              }}
              className="text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-xl cursor-pointer focus:outline-none max-w-[260px] truncate"
              title="Switch between existing estimates"
            >
              {allProjects.map((proj) => (
                <option key={proj.id} value={proj.id} className="bg-slate-950 text-slate-200">
                  {proj.id} - {proj.clientName} ({proj.buildingType || "Estimate"})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-lg">
              {normalizedProject.id} - {normalizedProject.clientName}
            </span>
          )}
          
          {/* Autosave Status Badge */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-mono">
            {saveStatus === "saving" ? (
              <span className="text-amber-400 flex items-center gap-1.5 font-bold">
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                <span>Saving...</span>
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-300">Autosaved</span>
                <span className="text-slate-500 text-[10px]">
                  {lastSavedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Prominent AI Document Clone Button */}
          <button
            onClick={() => setIsAiCloneModalOpen(true)}
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/40 hover:scale-[1.02] cursor-pointer"
            title="Drop or upload a PDF, Excel, or JPEG to generate an editable clone"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>✨ AI Clone Doc</span>
          </button>

          {/* Prominent Save Estimate Button */}
          <button
            onClick={handleManualSave}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            title="Save Estimate to local & cloud storage (Ctrl+S / Cmd+S)"
          >
            <Save className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Save Estimate</span>
            <span className="text-[10px] opacity-75 font-normal hidden sm:inline">(Ctrl+S)</span>
          </button>

          {/* Duplicate Estimate Button */}
          {onDuplicateProject && (
            <button
              onClick={() => onDuplicateProject(normalizedProject)}
              className="bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-700/80 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Duplicate this Estimate with a guaranteed new unique Estimate Number"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>Duplicate Estimate</span>
            </button>
          )}

          <button
            onClick={handleAddBlock}
            className="bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add Block</span>
          </button>


          <button
            onClick={() => setIsAiDockOpen(!isAiDockOpen)}
            className={`${
              isAiDockOpen
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-400"
                : "bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border-indigo-800"
            } border px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer`}
            title="Toggle Estimate AI Side Dock (Live Edit & Creation)"
          >
            <Bot className="w-4 h-4 text-amber-300" />
            <span>Estimate AI Dock</span>
            <span className="text-[9px] bg-emerald-500 text-slate-950 px-1 py-0.2 rounded font-bold uppercase">
              {isAiDockOpen ? "DOCKED" : "DOCK"}
            </span>
          </button>

          <button
            onClick={() => setIsQRModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>QR Verification</span>
          </button>

          <button
            onClick={() => setIsAttachModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Paperclip className="w-4 h-4 text-cyan-400" />
            <span>Attachments</span>
          </button>

          {onOpenStageCertificates && (
            <button
              onClick={onOpenStageCertificates}
              className="bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-700/80 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Open Stage and Completion Certificates for this Estimate"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Stage / Completion Cert</span>
            </button>
          )}

          {onConvertToProject && (
            <button
              onClick={() => onConvertToProject(normalizedProject)}
              className="bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Convert this estimate into a CRM Project record"
            >
              <FolderKanban className="w-4 h-4 text-emerald-400" />
              <span>Convert to Project</span>
            </button>
          )}

          {onConvertToInvoice && (
            <button
              onClick={() => onConvertToInvoice(normalizedProject)}
              className="bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Convert this estimate into an Office Invoice"
            >
              <Receipt className="w-4 h-4 text-cyan-400" />
              <span>Convert to Invoice</span>
            </button>
          )}

          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>EXPORT</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Estimate (A4 Fit)</span>
          </button>

          {onDeleteProject && (
            <button
              onClick={() => {
                onDeleteProject(normalizedProject.id);
                if (onGoToDashboard) onGoToDashboard();
              }}
              className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Estimate</span>
            </button>
          )}

          {/* Engineer Selector & Visibility Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={handleToggleEngineerDetails}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showEngineerDetails
                  ? "bg-indigo-950 text-indigo-300 border border-indigo-700/80"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
              title={
                showEngineerDetails
                  ? "Engineer details & signature are SHOWN in estimate and print. Click to hide."
                  : "Engineer details are HIDDEN from estimate and print. Click to show."
              }
            >
              {showEngineerDetails ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Engineer:</span>
                  <span className="text-emerald-400">Shown</span>
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Engineer:</span>
                  <span className="text-rose-400">Hidden</span>
                </>
              )}
            </button>

            {showEngineerDetails && (
              <select
                value={selectedEngineerId}
                onChange={(e) => handleEngineerChange(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-400 focus:outline-none cursor-pointer"
              >
                {INITIAL_PRESETS_ENGINEERS.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {stripEr(eng.fullName)} ({eng.designation})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Accordion: Project Details & Auto Headline Narrative */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print:hidden">
        <div
          onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
          className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100 font-sans">
              Project Title, Client Details & Automatic Headline Narrative
            </h3>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              (Editing Client or Survey Details automatically updates the narrative below)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAttachModalOpen(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
              <span>Attachments</span>
            </button>

            {isHeaderExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {isHeaderExpanded && (
          <div className="p-6 space-y-6">
            {/* Auto Narrative Banner */}
            <div className="space-y-1.5 bg-slate-950 p-4 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Official Estimation Headline & Description Narrative (Auto-Generated)</span>
                </label>
                <button
                  onClick={handleAutoGenerateNarrative}
                  className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Re-Sync Narrative Now
                </button>
              </div>

              <textarea
                rows={3}
                value={normalizedProject.headlineNarrative}
                onChange={(e) => handleManualFieldChange("headlineNarrative", e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-sans leading-relaxed focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 font-mono">
                * Note: Changes in '👤 Client & Owner Details' and '📍 Land Survey & Building Specifications' auto-edit this narrative dynamically.
              </p>
            </div>

            {/* Client & Land Specs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Client & Owner Details */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>👤 Client & Owner Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Owner / Client Name *</label>
                    <input
                      type="text"
                      value={normalizedProject.clientName}
                      onChange={(e) => handleClientOrLandFieldChange("clientName", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-sans focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Customer Phone Number *</label>
                    <input
                      type="text"
                      value={normalizedProject.clientPhone}
                      onChange={(e) => handleClientOrLandFieldChange("clientPhone", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">House Name / Address</label>
                    <input
                      type="text"
                      value={normalizedProject.houseName}
                      onChange={(e) => handleClientOrLandFieldChange("houseName", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-sans focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Post Office (P.O.)</label>
                    <input
                      type="text"
                      value={normalizedProject.postOffice}
                      onChange={(e) => handleClientOrLandFieldChange("postOffice", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-sans focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Panchayat & Village</label>
                    <input
                      type="text"
                      value={normalizedProject.panchayatVillage}
                      onChange={(e) => handleClientOrLandFieldChange("panchayatVillage", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-sans focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">District & Pincode</label>
                    <input
                      type="text"
                      value={normalizedProject.districtPincode}
                      onChange={(e) => handleClientOrLandFieldChange("districtPincode", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-sans focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Land Survey & Specs */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📍 Land Survey & Building Specifications</span>
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Sy. No.</label>
                    <input
                      type="text"
                      value={normalizedProject.syNo}
                      onChange={(e) => handleClientOrLandFieldChange("syNo", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Block No.</label>
                    <input
                      type="text"
                      value={normalizedProject.blockNo}
                      onChange={(e) => handleClientOrLandFieldChange("blockNo", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Ward No.</label>
                    <input
                      type="text"
                      value={normalizedProject.wardNo}
                      onChange={(e) => handleClientOrLandFieldChange("wardNo", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Building Structure Type</label>
                    <input
                      type="text"
                      value={normalizedProject.buildingType}
                      onChange={(e) => handleClientOrLandFieldChange("buildingType", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-sans focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Plinth Area (Sq.Ft)</label>
                    <input
                      type="number"
                      value={normalizedProject.plinthAreaSqFt}
                      onChange={(e) => {
                        const sqft = Number(e.target.value);
                        const sqm = Number((sqft * 0.092903).toFixed(2));
                        const updated = {
                          ...normalizedProject,
                          plinthAreaSqFt: sqft,
                          plinthAreaSqM: sqm
                        };
                        updated.headlineNarrative = generateAutoHeadlineNarrative(updated);
                        updateNormalized(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono text-slate-400">Prepared By Engineer</label>
                      <button
                        type="button"
                        onClick={handleToggleEngineerDetails}
                        className="text-[9px] font-mono text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        {showEngineerDetails ? "✓ Shown in Estimate" : "✗ Hidden from Estimate"}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={normalizedProject.preparedBy}
                      onChange={(e) => handleManualFieldChange("preparedBy", e.target.value)}
                      disabled={!showEngineerDetails}
                      className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 ${
                        showEngineerDetails ? "text-amber-300" : "text-slate-500 opacity-60"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Estimation Date</label>
                    <input
                      type="date"
                      value={normalizedProject.estimationDate}
                      onChange={(e) => handleManualFieldChange("estimationDate", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable Official Document Header (Visible ONLY during print) */}
      <div className="hidden print:block mb-2 font-serif border-b-2 border-black pb-1.5">
        <div className="flex justify-between items-start gap-4 mb-1.5">
          <div className="space-y-0.5 flex-1">
            <div className="text-2xl font-black text-black font-sans uppercase tracking-wider underline pb-1">
              DETAILED BUILDING ESTIMATE
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono text-[10px] space-y-0.5">
              <div className="font-bold text-black text-xs">REF NO: {normalizedProject.id}</div>
              <div className="text-black">DATE: {normalizedProject.estimationDate}</div>
              <div className="text-black font-bold text-[9px] border border-black px-1.5 py-0.5 inline-block uppercase mt-0.5">
                KPBR COMPLIANT
              </div>
            </div>

            {printQrUrl && (
              <div className="flex flex-col items-center justify-center border border-black p-1 bg-white shrink-0">
                <img src={printQrUrl} alt="Verification QR" className="w-14 h-14 object-contain" />
                <span className="text-[7px] font-mono font-bold text-black uppercase tracking-tighter mt-0.5">
                  SCAN TO VERIFY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-1.5 border border-black text-[10px] space-y-0.5 bg-white">
          <div className="font-bold uppercase text-[10px] border-b border-black pb-0.5 text-black flex justify-between font-sans">
            <span>PROJECT & CLIENT SPECIFICATIONS</span>
            <span>PLINTH AREA: {normalizedProject.plinthAreaSqFt} SQ.FT ({normalizedProject.plinthAreaSqM} SQ.M)</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-black pt-0.5">
            <div><strong>Client / Owner:</strong> {normalizedProject.clientName}</div>
            <div><strong>Contact Phone:</strong> {normalizedProject.clientPhone}</div>
            <div><strong>House Name / Address:</strong> {normalizedProject.houseName}, {normalizedProject.postOffice}</div>
            <div><strong>Panchayat & Village:</strong> {normalizedProject.panchayatVillage}</div>
            <div><strong>District & Pincode:</strong> {normalizedProject.districtPincode}</div>
            <div><strong>Re-Survey No:</strong> {normalizedProject.syNo} (Block: {normalizedProject.blockNo}, Ward: {normalizedProject.wardNo})</div>
            <div><strong>Building Type:</strong> {normalizedProject.buildingType}</div>
            {showEngineerDetails ? (
              <div><strong>Prepared By:</strong> {stripEr(normalizedProject.preparedBy)} (Reg: {normalizedProject.regNo})</div>
            ) : (
              <div><strong>Estimation Date:</strong> {normalizedProject.estimationDate}</div>
            )}
          </div>
          {normalizedProject.headlineNarrative && (
            <div className="pt-0.5 border-t border-black text-[9px] italic text-black font-sans">
              <strong>Official Estimate Narrative:</strong> {normalizedProject.headlineNarrative}
            </div>
          )}
        </div>
      </div>

      {/* BLOCKS & APPENDICES ESTIMATE STRUCTURE */}
      <div className="space-y-8 print:space-y-2">
        {blocksList.map((block, blockIdx) => (
          <div
            key={block.id}
            className="bg-slate-950 border-2 border-indigo-900/60 rounded-3xl p-4 md:p-6 shadow-2xl space-y-6 print:bg-white print:border-black print:rounded-none print:p-0 print:m-0 print:space-y-1"
          >
            {/* BLOCK Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-800/60 rounded-2xl p-4 print:bg-white print:border-black print:rounded-none print:p-1 print:my-0.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold print:hidden">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block print:text-black">
                    STRUCTURE BLOCK {blockIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={block.blockTitle}
                    onChange={(e) => handleUpdateBlockTitle(blockIdx, e.target.value)}
                    className="w-full bg-transparent border-b border-indigo-700/50 focus:border-indigo-400 font-bold text-base text-white font-mono focus:outline-none print:border-none print:text-black print:font-bold print:text-sm"
                  />
                </div>
              </div>

              {/* Block Controls & Subtotal */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase print:text-black">
                    BLOCK SUBTOTAL
                  </div>
                  <div className="text-lg font-black text-amber-400 font-mono print:text-black">
                    ₹{block.totalAmount.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Actions for Block */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl print:hidden">
                  <button
                    onClick={() => handleMoveBlock(blockIdx, "up")}
                    disabled={blockIdx === 0}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Move Block Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveBlock(blockIdx, "down")}
                    disabled={blockIdx === blocksList.length - 1}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Move Block Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleAddAppendix(blockIdx)}
                    className="p-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer ml-1"
                    title="Add Floor / Appendix under this Block"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add Floor</span>
                  </button>

                  <button
                    onClick={() => handleDeleteBlock(blockIdx)}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg cursor-pointer ml-1"
                    title="Delete Block"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* APPENDICES (FLOORS) INSIDE THIS BLOCK */}
            <div className="space-y-6 print:space-y-4">
              {block.appendices.map((app, appIdx) => (
                <div
                  key={app.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4 print:bg-white print:border-black print:rounded-none print:p-0"
                >
                  {/* Appendix Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 print:border-black">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={app.title}
                          onChange={(e) =>
                            handleUpdateAppendixMeta(blockIdx, appIdx, e.target.value, app.subtitle || "")
                          }
                          className="bg-transparent text-sm font-black text-emerald-400 font-mono tracking-wider focus:outline-none border-b border-emerald-800/40 focus:border-emerald-400 print:text-black print:border-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={app.subtitle || ""}
                        placeholder="Floor subtitle / description..."
                        onChange={(e) =>
                          handleUpdateAppendixMeta(blockIdx, appIdx, app.title, e.target.value)
                        }
                        className="bg-transparent text-xs text-slate-400 font-sans focus:outline-none w-full print:text-gray-600 print:border-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-slate-400 uppercase print:text-gray-600">
                          FLOOR TOTAL
                        </div>
                        <div className="text-base font-black text-emerald-400 font-mono print:text-black">
                          ₹{app.totalAmount.toLocaleString("en-IN")}
                        </div>
                      </div>

                      {/* Floor / Appendix Controls */}
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl print:hidden">
                        <button
                          onClick={() => handleMoveAppendix(blockIdx, appIdx, "up")}
                          disabled={appIdx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move Floor Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveAppendix(blockIdx, appIdx, "down")}
                          disabled={appIdx === block.appendices.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move Floor Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenSearchModal(blockIdx, appIdx)}
                          className="p-1.5 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer border border-indigo-800"
                          title="Search Items of Work Master Library & Include to Floor"
                        >
                          <Search className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Search Items</span>
                        </button>

                        <button
                          onClick={() => handleAddItem(blockIdx, appIdx)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                          title="Add Main Particulars of Work Item"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Add Item</span>
                        </button>

                        <button
                          onClick={() => handleAddSubItem(blockIdx, appIdx)}
                          className="p-1.5 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer border border-indigo-800"
                          title="Add Sub Item / measurement breakdown"
                        >
                          <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Add Sub Item</span>
                        </button>

                        <button
                          onClick={() => handleDeleteAppendix(blockIdx, appIdx)}
                          className="p-1 text-rose-400 hover:bg-rose-950/50 rounded cursor-pointer"
                          title="Delete Floor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Floor Quick Search & Add Bar */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 print:hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-mono text-slate-300">
                        Items of Work Library:
                      </span>
                      <button
                        onClick={() => handleOpenSearchModal(blockIdx, appIdx)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Search Items & Sub-Items to Include</span>
                      </button>
                    </div>

                    {onOpenItemsOfWorkMaster && (
                      <button
                        onClick={onOpenItemsOfWorkMaster}
                        className="text-[11px] font-mono text-indigo-400 hover:text-indigo-200 underline flex items-center gap-1 cursor-pointer"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Manage Items of Work Master Tab</span>
                      </button>
                    )}
                  </div>

                  {/* Spreadsheet Selection & Merge Cell Toolbar */}
                  <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCellSelectMode(!isCellSelectMode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                          isCellSelectMode
                            ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/30"
                            : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                        }`}
                        title="Toggle Excel-like drag cell selection mode"
                      >
                        <MousePointer className="w-3.5 h-3.5" />
                        <span>Excel Cell Select Mode: {isCellSelectMode ? "ON" : "OFF"}</span>
                      </button>

                      {selectedCellRange && selectedCellRange.blockIdx === blockIdx && selectedCellRange.appIdx === appIdx ? (
                        (() => {
                          const minR = Math.min(selectedCellRange.startRow, selectedCellRange.endRow);
                          const maxR = Math.max(selectedCellRange.startRow, selectedCellRange.endRow);
                          const minC = Math.min(selectedCellRange.startCol, selectedCellRange.endCol);
                          const maxC = Math.max(selectedCellRange.startCol, selectedCellRange.endCol);
                          const totalCells = (maxR - minR + 1) * (maxC - minC + 1);
                          const colNames = ["SL", "Particulars", "NOS", "L", "B", "D", "QTY", "Unit", "Rate", "Amount"];
                          const isMultiRow = maxR > minR;

                          return (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-1 bg-indigo-950/90 text-indigo-300 border border-indigo-700/80 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                                <span>
                                  {totalCells} Cell{totalCells > 1 ? "s" : ""} (Row {minR + 1}{isMultiRow ? `–${maxR + 1}` : ""}: {colNames[minC]} → {colNames[maxC]})
                                </span>
                              </span>

                              <button
                                type="button"
                                onClick={() => handleMergeCells(blockIdx, appIdx)}
                                disabled={totalCells < 2}
                                className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                                title="Merge all selected cells into a single merged cell (Excel Merge & Center)"
                              >
                                <Grid className="w-3.5 h-3.5" />
                                <span>Merge Selected Cells</span>
                              </button>

                              {isMultiRow && maxC > minC && (
                                <button
                                  type="button"
                                  onClick={() => handleMergeAcross(blockIdx, appIdx)}
                                  className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                                  title="Merge selected columns across each row independently"
                                >
                                  <Columns className="w-3.5 h-3.5" />
                                  <span>Merge Across (Rows)</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleUnmergeCells(blockIdx, appIdx)}
                                className="px-3 py-1 bg-amber-600/90 hover:bg-amber-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                                title="Unmerge any merged cells in this selection"
                              >
                                <Split className="w-3.5 h-3.5" />
                                <span>Unmerge</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedCellRange(null)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
                                title="Clear selection (Esc)"
                              >
                                <X className="w-3 h-3" />
                                <span>Clear (Esc)</span>
                              </button>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400">
                            Select cells by dragging across columns (e.g. NOS → UNIT) or click row merge buttons below:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (app.items.length > 0) {
                                handleQuickMergeNosToUnit(blockIdx, appIdx, 0);
                              }
                            }}
                            className="px-2 py-0.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                            title="Quick Merge NOS, L, B, D, QTY, UNIT on Row 1"
                          >
                            <Grid className="w-3 h-3" />
                            <span>Merge NOS→UNIT (Row 1)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      {app.mergedRanges && app.mergedRanges.length > 0 && (
                        <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-700/70 px-2.5 py-1 rounded-lg">
                          <span className="text-[11px] text-indigo-300 font-bold">
                            {app.mergedRanges.length} Merged Cell Area{app.mergedRanges.length > 1 ? "s" : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUnmergeCells(blockIdx, appIdx)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                            title="Unmerge all cells in this floor"
                          >
                            <Split className="w-3 h-3" />
                            <span>Unmerge All</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Items Table for this Floor */}
                  <div className="overflow-x-auto">
                    {/* Screen interactive table */}
                    <table className={`w-full text-left text-xs font-sans print:hidden ${isCellSelectMode ? "cursor-crosshair" : ""}`}>
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-2.5 w-12 text-center select-none" title="Serial Number">SL</th>
                          <th className="p-2.5 min-w-[260px] select-none">PARTICULARS OF WORK</th>
                          <th
                            className="p-2.5 w-14 text-center cursor-pointer hover:bg-slate-900 select-none text-indigo-300"
                            onClick={() => handleSelectRowCols(blockIdx, appIdx, 0, 2, 7)}
                            title="NOS Column — Click to select NOS → UNIT on Row 1"
                          >
                            NOS
                          </th>
                          <th className="p-2.5 w-16 text-right select-none">L (m)</th>
                          <th className="p-2.5 w-16 text-right select-none">B (m)</th>
                          <th className="p-2.5 w-16 text-right select-none">D (m)</th>
                          <th className="p-2.5 w-24 text-right font-bold text-amber-400 select-none">
                            <div className="flex flex-col items-end">
                              <span>QTY</span>
                              <span className="text-[8px] font-normal text-amber-400/70 normal-case tracking-tight font-mono">(Double-click edit)</span>
                            </div>
                          </th>
                          <th
                            className="p-2.5 w-16 text-center cursor-pointer hover:bg-slate-900 select-none text-indigo-300"
                            onClick={() => handleSelectRowCols(blockIdx, appIdx, 0, 2, 7)}
                            title="UNIT Column — Click to select NOS → UNIT on Row 1"
                          >
                            UNIT
                          </th>
                          <th className="p-2.5 w-24 text-right select-none">RATE (₹)</th>
                          <th className="p-2.5 w-28 text-right font-bold select-none">AMOUNT (₹)</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {app.items.map((item, itemIdx) => {
                          const hasSubItems = isMainItemWithSubItems(app.items, itemIdx);

                          const isCellSelected = (cIdx: number) => {
                            if (!selectedCellRange) return false;
                            if (selectedCellRange.blockIdx !== blockIdx || selectedCellRange.appIdx !== appIdx) return false;
                            const minR = Math.min(selectedCellRange.startRow, selectedCellRange.endRow);
                            const maxR = Math.max(selectedCellRange.startRow, selectedCellRange.endRow);
                            const minC = Math.min(selectedCellRange.startCol, selectedCellRange.endCol);
                            const maxC = Math.max(selectedCellRange.startCol, selectedCellRange.endCol);
                            return itemIdx >= minR && itemIdx <= maxR && cIdx >= minC && cIdx <= maxC;
                          };

                          const colNames = ["SL", "Particulars", "NOS", "L", "B", "D", "QTY", "Unit", "Rate", "Amount"];

                          const renderCellWrapper = (
                            colIdx: number,
                            content: React.ReactNode,
                            alignClass = "text-center",
                            extraPadding = "p-2"
                          ) => {
                            const mergeInfo = getMergeInfo(app.mergedRanges, itemIdx, colIdx);
                            if (mergeInfo.isCovered && !mergeInfo.isOrigin) {
                              return null;
                            }

                            const selected = isCellSelected(colIdx);
                            const isOrigin = mergeInfo.isCovered && mergeInfo.isOrigin;
                            const isMultiColMerged = isOrigin && mergeInfo.colSpan > 1;

                            const rangeMinCol = mergeInfo.range ? Math.min(mergeInfo.range.startCol, mergeInfo.range.endCol) : colIdx;
                            const rangeMaxCol = mergeInfo.range ? Math.max(mergeInfo.range.startCol, mergeInfo.range.endCol) : colIdx;
                            const spansQty = isOrigin && rangeMinCol <= 6 && rangeMaxCol >= 6;
                            const isOrSpansQty = colIdx === 6 || spansQty;

                            return (
                              <td
                                key={`cell_${itemIdx}_${colIdx}`}
                                colSpan={isOrigin ? mergeInfo.colSpan : 1}
                                rowSpan={isOrigin ? mergeInfo.rowSpan : 1}
                                onMouseDown={(e) => {
                                  const tag = (e.target as HTMLElement).tagName;
                                  if (isCellSelectMode || (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "BUTTON")) {
                                    handleCellMouseDown(blockIdx, appIdx, itemIdx, colIdx, e);
                                  }
                                }}
                                onDoubleClick={(e) => {
                                  const tag = (e.target as HTMLElement).tagName;
                                  if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "BUTTON") {
                                    if (isOrSpansQty) {
                                      e.stopPropagation();
                                      setEditingQtyItemId(item.id);
                                    }
                                  }
                                }}
                                onClick={(e) => {
                                  const tag = (e.target as HTMLElement).tagName;
                                  if (tag !== "BUTTON") {
                                    setSelectedCellRange({
                                      blockIdx,
                                      appIdx,
                                      startRow: itemIdx,
                                      startCol: colIdx,
                                      endRow: isOrigin && mergeInfo.rowSpan > 1 ? itemIdx + mergeInfo.rowSpan - 1 : itemIdx,
                                      endCol: isOrigin && mergeInfo.colSpan > 1 ? colIdx + mergeInfo.colSpan - 1 : colIdx
                                    });
                                  }
                                }}
                                onMouseEnter={() => handleCellMouseEnter(blockIdx, appIdx, itemIdx, colIdx)}
                                className={`${extraPadding} ${alignClass} transition-all relative select-none ${
                                  selected
                                    ? "bg-indigo-500/30 ring-2 ring-indigo-400 ring-inset z-10"
                                    : isOrigin
                                    ? "bg-indigo-950/40 border border-indigo-500/50"
                                    : ""
                                }`}
                              >
                                {isOrigin && (
                                  <div className="mb-1.5 flex items-center justify-between gap-1 bg-indigo-950 text-indigo-300 border border-indigo-700/80 px-2 py-0.5 rounded text-[10px] font-mono shadow-sm font-bold">
                                    <span className="flex items-center gap-1">
                                      <Grid className="w-3 h-3 text-indigo-400" />
                                      <span>
                                        Merged ({colNames[mergeInfo.range?.startCol ?? colIdx]} → {colNames[mergeInfo.range?.endCol ?? colIdx]})
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnmergeCells(blockIdx, appIdx, mergeInfo.range?.id);
                                      }}
                                      className="text-rose-400 hover:text-rose-200 px-1 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-[9px] font-bold cursor-pointer flex items-center gap-0.5"
                                      title="Unmerge these cells"
                                    >
                                      <Split className="w-2.5 h-2.5" />
                                      <span>Unmerge</span>
                                    </button>
                                  </div>
                                )}

                                {/* Cell Selection Corner Grip for Easy Mouse Drag Selection */}
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCellMouseDown(blockIdx, appIdx, itemIdx, colIdx, e);
                                  }}
                                  className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-sm transition-opacity opacity-0 group-hover/row:opacity-60 hover:!opacity-100 cursor-crosshair ${
                                    selected ? "!opacity-100 bg-indigo-400 shadow-sm" : "bg-slate-600"
                                  }`}
                                  title="Click/drag to select cells like Excel"
                                />

                                {isMultiColMerged ? (
                                  <div className="w-full flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={mergeInfo.range?.mergedValue ?? ""}
                                        placeholder="Merged text/note (e.g. Lump Sum / As per site / Detail drawing)..."
                                        onChange={(e) => {
                                          if (mergeInfo.range) {
                                            handleUpdateMergedValue(blockIdx, appIdx, mergeInfo.range.id, e.target.value);
                                          }
                                        }}
                                        className="flex-1 bg-slate-950 border border-indigo-500/60 focus:border-emerald-400 rounded-lg px-2.5 py-1.5 text-xs text-indigo-100 font-mono focus:outline-none placeholder:text-slate-500"
                                      />
                                      {spansQty && colIdx !== 6 && (
                                        <div
                                          className="shrink-0 flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-amber-500/60 rounded-lg"
                                          onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            setEditingQtyItemId(item.id);
                                          }}
                                        >
                                          <span className="text-[10px] font-mono text-amber-400 font-bold">QTY:</span>
                                          {editingQtyItemId === item.id ? (
                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                              <input
                                                type="number"
                                                step="any"
                                                autoFocus
                                                value={item.quantity === 0 ? "" : item.quantity}
                                                placeholder="0"
                                                onChange={(e) =>
                                                  handleItemChange(blockIdx, appIdx, itemIdx, "quantity", e.target.value)
                                                }
                                                onBlur={() => setEditingQtyItemId(null)}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter" || e.key === "Escape") {
                                                    setEditingQtyItemId(null);
                                                  }
                                                }}
                                                className="w-20 bg-slate-950 border-2 border-amber-400 text-right p-0.5 rounded text-amber-300 font-mono font-bold text-xs focus:outline-none ring-1 ring-amber-400"
                                                title="Press Enter or click away"
                                              />
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingQtyItemId(null);
                                                }}
                                                className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-bold cursor-pointer"
                                              >
                                                ✓
                                              </button>
                                            </div>
                                          ) : (
                                            <div
                                              onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                setEditingQtyItemId(item.id);
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingQtyItemId(item.id);
                                              }}
                                              className="flex items-center gap-1 cursor-pointer hover:bg-amber-950/60 px-1 py-0.5 rounded transition-colors"
                                              title="Click or double-click to edit Quantity"
                                            >
                                              <span className="font-mono text-amber-300 font-bold text-xs">
                                                {item.quantity}
                                              </span>
                                              {item.unit && (
                                                <span className="text-slate-400 text-[10px] font-mono">{item.unit}</span>
                                              )}
                                              {item.isManualQty && (
                                                <span className="text-[7.5px] bg-amber-900 text-amber-300 px-0.5 rounded font-mono font-bold">
                                                  M
                                                </span>
                                              )}
                                              <span className="text-amber-400 hover:text-amber-200 text-[10px]" title="Edit Quantity">
                                                ✎
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {content}
                                  </div>
                                ) : (
                                  content
                                )}
                              </td>
                            );
                          };

                          const isRowSelected = Boolean(
                            selectedCellRange &&
                            selectedCellRange.blockIdx === blockIdx &&
                            selectedCellRange.appIdx === appIdx &&
                            itemIdx >= Math.min(selectedCellRange.startRow, selectedCellRange.endRow) &&
                            itemIdx <= Math.max(selectedCellRange.startRow, selectedCellRange.endRow)
                          );

                          return (
                            <tr
                              key={item.id}
                              id={`estimate-row-${blockIdx}-${appIdx}-${itemIdx}`}
                              className={`transition-colors group/row ${
                                isRowSelected
                                  ? "ring-2 ring-indigo-500/80 bg-indigo-950/40 shadow-md"
                                  : item.isDeduction
                                  ? "bg-rose-950/25 hover:bg-rose-950/40 border-l-2 border-rose-500"
                                  : item.isSubItem
                                  ? "bg-indigo-950/20 hover:bg-indigo-950/35 border-l-2 border-indigo-500"
                                  : hasSubItems
                                  ? "bg-slate-900/60 hover:bg-slate-850 border-l-2 border-emerald-500"
                                  : "hover:bg-slate-800/30"
                              }`}
                            >
                              {/* Col 0: SL */}
                              {renderCellWrapper(
                                0,
                                <input
                                  type="text"
                                  value={item.slNo}
                                  onChange={(e) =>
                                    handleItemChange(blockIdx, appIdx, itemIdx, "slNo", e.target.value)
                                  }
                                  className={`w-11 bg-transparent text-center font-mono text-xs focus:outline-none focus:bg-slate-900 rounded p-0.5 ${
                                    item.isDeduction
                                      ? "text-rose-400 font-bold"
                                      : item.isSubItem
                                      ? "text-indigo-300 font-semibold"
                                      : hasSubItems
                                      ? "text-emerald-400 font-bold"
                                      : "text-slate-400"
                                  }`}
                                  title="Serial Number (editable)"
                                />,
                                "text-center font-bold"
                              )}

                              {/* Col 1: PARTICULARS */}
                              {renderCellWrapper(
                                1,
                                <div className="flex flex-col gap-1.5">
                                  {item.isSubItem && (
                                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                                      <CornerDownRight className="w-3 h-3 text-indigo-400 shrink-0" />
                                      <span className={`px-1.5 py-0.5 rounded border font-bold ${
                                        item.isDeduction
                                          ? "bg-rose-950/90 text-rose-300 border-rose-800/80"
                                          : "bg-indigo-950 text-indigo-300 border-indigo-800/80"
                                      }`}>
                                        {item.isDeduction ? "[-] SUB-ITEM DEDUCTION" : "SUB-ITEM"}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleDeduction(blockIdx, appIdx, itemIdx)}
                                        className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold cursor-pointer transition ${
                                          item.isDeduction
                                            ? "bg-rose-900/70 text-rose-200 border-rose-700 hover:bg-rose-800"
                                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-rose-300 hover:border-rose-800"
                                        }`}
                                        title={item.isDeduction ? "Click to switch to Addition (+)" : "Click to mark as Subtraction / Deduction (-)"}
                                      >
                                        {item.isDeduction ? "(-) Deduction" : "(+) Addition"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSubItem(blockIdx, appIdx, itemIdx)}
                                        className="text-slate-500 hover:text-slate-300 underline text-[9px] cursor-pointer ml-1"
                                        title="Convert to main item"
                                      >
                                        Convert to Main Item
                                      </button>
                                    </div>
                                  )}
                                  {!item.isSubItem && (
                                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                                      {hasSubItems && (
                                        <span className="bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.5 rounded font-bold">
                                          MAIN ITEM (Sub-items Breakdown Below)
                                        </span>
                                      )}
                                      {item.isDeduction && (
                                        <span className="bg-rose-950/90 text-rose-300 border border-rose-800/80 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                          <Minus className="w-2.5 h-2.5" /> DEDUCTION WORK
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleDeduction(blockIdx, appIdx, itemIdx)}
                                        className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold cursor-pointer transition ${
                                          item.isDeduction
                                            ? "bg-rose-900/70 text-rose-200 border-rose-700 hover:bg-rose-800"
                                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-rose-300 hover:border-rose-800"
                                        }`}
                                        title={item.isDeduction ? "Click to switch to Normal Addition (+)" : "Click to mark as Subtraction / Deduction Work (-)"}
                                      >
                                        {item.isDeduction ? "(-) Subtraction" : "(+) Normal"}
                                      </button>
                                    </div>
                                  )}
                                  <textarea
                                    rows={item.isSubItem ? 2 : 3}
                                    value={item.particulars}
                                    onChange={(e) =>
                                      handleItemChange(blockIdx, appIdx, itemIdx, "particulars", e.target.value)
                                    }
                                    className={`w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-lg p-2 text-xs text-slate-100 focus:outline-none resize-y leading-relaxed font-sans break-normal ${
                                      item.isDeduction
                                        ? "border-rose-900/60 focus:border-rose-500"
                                        : item.isSubItem
                                        ? "pl-3 border-indigo-900/60 focus:border-indigo-500"
                                        : hasSubItems
                                        ? "border-emerald-900/60 font-semibold text-slate-100"
                                        : ""
                                    }`}
                                    placeholder={
                                      item.isDeduction
                                        ? "Deduction description (e.g. Deduct: Door D1 openings, Window W1 voids)..."
                                        : item.isSubItem
                                        ? "Sub-item measurement description (e.g. Long wall, Short wall, Steps)..."
                                        : "Write full description for particulars of work..."
                                    }
                                  />
                                </div>,
                                "text-left font-sans"
                              )}

                              {/* Col 2: NOS */}
                              {renderCellWrapper(
                                2,
                                hasSubItems ? (
                                  <span className="text-slate-600 font-mono text-xs select-none block text-center" title="Breakdown in sub-items below">—</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={item.nos}
                                    onChange={(e) =>
                                      handleItemChange(blockIdx, appIdx, itemIdx, "nos", e.target.value)
                                    }
                                    className="w-12 bg-slate-950 border border-slate-800 text-center p-1 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                                  />
                                ),
                                "text-center"
                              )}

                              {/* Col 3: L */}
                              {renderCellWrapper(
                                3,
                                hasSubItems ? (
                                  <span className="text-slate-600 font-mono text-xs select-none block text-right pr-2" title="Breakdown in sub-items below">—</span>
                                ) : (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.length}
                                    onChange={(e) =>
                                      handleItemChange(blockIdx, appIdx, itemIdx, "length", e.target.value)
                                    }
                                    className="w-16 bg-slate-950 border border-slate-800 text-right p-1 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                                  />
                                ),
                                "text-right"
                              )}

                              {/* Col 4: B */}
                              {renderCellWrapper(
                                4,
                                hasSubItems ? (
                                  <span className="text-slate-600 font-mono text-xs select-none block text-right pr-2" title="Breakdown in sub-items below">—</span>
                                ) : (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.breadth}
                                    onChange={(e) =>
                                      handleItemChange(blockIdx, appIdx, itemIdx, "breadth", e.target.value)
                                    }
                                    className="w-16 bg-slate-950 border border-slate-800 text-right p-1 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                                  />
                                ),
                                "text-right"
                              )}

                              {/* Col 5: D */}
                              {renderCellWrapper(
                                5,
                                hasSubItems ? (
                                  <span className="text-slate-600 font-mono text-xs select-none block text-right pr-2" title="Breakdown in sub-items below">—</span>
                                ) : (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.depth}
                                    onChange={(e) =>
                                      handleItemChange(blockIdx, appIdx, itemIdx, "depth", e.target.value)
                                    }
                                    className="w-16 bg-slate-950 border border-slate-800 text-right p-1 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                                  />
                                ),
                                "text-right"
                              )}

                              {/* Col 6: QTY */}
                              {renderCellWrapper(
                                6,
                                hasSubItems ? (
                                  <div className="flex flex-col items-end">
                                    <span className="font-mono text-amber-400 font-black text-xs">
                                      {item.quantity}
                                    </span>
                                    <span className="text-[8px] text-emerald-400 font-mono" title="Sum of all sub-item quantities">
                                      (Sum of subs)
                                    </span>
                                  </div>
                                ) : editingQtyItemId === item.id ? (
                                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="number"
                                      step="any"
                                      autoFocus
                                      value={item.quantity === 0 ? "" : item.quantity}
                                      placeholder="0"
                                      onChange={(e) =>
                                        handleItemChange(blockIdx, appIdx, itemIdx, "quantity", e.target.value)
                                      }
                                      onBlur={() => setEditingQtyItemId(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === "Escape") {
                                          setEditingQtyItemId(null);
                                        }
                                      }}
                                      className="w-20 bg-slate-950 border-2 border-amber-400 text-right p-1 rounded-md text-amber-300 font-mono font-bold text-xs focus:outline-none ring-2 ring-amber-400/30"
                                      title="Type manual quantity and press Enter or click away"
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingQtyItemId(null);
                                      }}
                                      className="px-1.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-bold cursor-pointer"
                                      title="Save quantity"
                                    >
                                      ✓
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      setEditingQtyItemId(item.id);
                                    }}
                                    onClick={(e) => {
                                      const target = e.target as HTMLElement;
                                      if (target.textContent?.includes("✎")) {
                                        e.stopPropagation();
                                        setEditingQtyItemId(item.id);
                                      }
                                    }}
                                    className="group/qty relative inline-flex items-center justify-end gap-1 cursor-pointer py-1 px-1.5 rounded hover:bg-amber-950/50 border border-transparent hover:border-amber-500/50 transition-all select-none"
                                    title="Double-click to manually edit Quantity"
                                  >
                                    <span className="font-mono text-amber-400 group-hover/qty:text-amber-300 font-bold">
                                      {item.quantity}
                                    </span>
                                    {item.isManualQty && (
                                      <span
                                        className="text-[8px] bg-amber-950/90 text-amber-400 border border-amber-600/70 px-1 rounded uppercase font-mono font-semibold"
                                        title="Manually entered quantity"
                                      >
                                        M
                                      </span>
                                    )}
                                    <span className="text-[9px] text-amber-400/70 opacity-0 group-hover/qty:opacity-100 transition-opacity font-sans" title="Edit">
                                      ✎
                                    </span>
                                  </div>
                                ),
                                "text-right font-bold text-amber-400 text-xs"
                              )}

                              {/* Col 7: UNIT */}
                              {renderCellWrapper(
                                7,
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) =>
                                    handleItemChange(blockIdx, appIdx, itemIdx, "unit", e.target.value)
                                  }
                                  placeholder="unit"
                                  className="w-14 bg-slate-950 border border-slate-800 text-center p-1 rounded text-slate-300 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                                />,
                                "text-center"
                              )}

                              {/* Col 8: RATE */}
                              {renderCellWrapper(
                                8,
                                item.isSubItem ? (
                                  <span className="text-slate-600 font-mono text-xs select-none block text-right pr-2" title="Sub-items cannot have rate. Rate is set on main item.">—</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={item.rate}
                                    onChange={(e) =>
                                      handleItemChange(blockIdx, appIdx, itemIdx, "rate", e.target.value)
                                    }
                                    className="w-20 bg-slate-950 border border-slate-800 text-right p-1 rounded text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                                  />
                                ),
                                "text-right"
                              )}

                              {/* Col 9: AMOUNT */}
                              {renderCellWrapper(
                                9,
                                item.isSubItem ? (
                                  <span className="text-slate-600 font-mono text-xs select-none block text-right pr-2" title="Sub-items have values up to quantity only">—</span>
                                ) : (
                                  <div>
                                    <div className="font-black text-emerald-400 text-xs">
                                      ₹{item.amount.toLocaleString("en-IN")}
                                    </div>
                                    {hasSubItems && (
                                      <div className="text-[9px] text-indigo-300 font-mono">
                                        (Qty × Rate)
                                      </div>
                                    )}
                                  </div>
                                ),
                                "text-right"
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Printable A4 Table Layout with Merged Cells Support */}
                    <table className="hidden print:table estimate-table-print bg-white text-black">
                      <thead>
                        <tr className="bg-white text-black font-bold border-b border-black">
                          <th className="col-slno bg-white text-black font-bold border border-black">SL</th>
                          <th className="col-particulars bg-white text-black font-bold border border-black">PARTICULARS OF WORK</th>
                          <th className="col-nos bg-white text-black font-bold border border-black">NOS</th>
                          <th className="col-l bg-white text-black font-bold border border-black">L (m)</th>
                          <th className="col-b bg-white text-black font-bold border border-black">B (m)</th>
                          <th className="col-d bg-white text-black font-bold border border-black">D (m)</th>
                          <th className="col-qty bg-white text-black font-bold border border-black">QTY</th>
                          <th className="col-unit bg-white text-black font-bold border border-black">UNIT</th>
                          <th className="col-rate bg-white text-black font-bold border border-black">RATE (₹)</th>
                          <th className="col-amount bg-white text-black font-bold border border-black">AMOUNT (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {app.items.map((item, itemIdx) => {
                          const hasSubItems = isMainItemWithSubItems(app.items, itemIdx);

                          const renderPrintCell = (colIdx: number, content: React.ReactNode, colClass: string) => {
                            const mergeInfo = getMergeInfo(app.mergedRanges, itemIdx, colIdx);
                            if (mergeInfo.isCovered && !mergeInfo.isOrigin) {
                              return null;
                            }
                            const isOrigin = mergeInfo.isCovered && mergeInfo.isOrigin;
                            const isMultiColMerged = isOrigin && mergeInfo.colSpan > 1;

                            return (
                              <td
                                key={`print_c_${colIdx}`}
                                colSpan={isOrigin ? mergeInfo.colSpan : 1}
                                rowSpan={isOrigin ? mergeInfo.rowSpan : 1}
                                className={`${colClass} ${isMultiColMerged ? "!text-center font-bold font-mono print:text-black" : ""}`}
                              >
                                {isMultiColMerged && mergeInfo.range?.mergedValue ? (
                                  <div className="text-center font-bold font-mono text-black">
                                    {mergeInfo.range.mergedValue}
                                  </div>
                                ) : (
                                  content
                                )}
                              </td>
                            );
                          };

                          return (
                            <tr
                              key={`print_${item.id}`}
                              className={
                                item.isDeduction
                                  ? "deduction-row font-semibold text-rose-900 bg-rose-50/50 print:bg-white print:text-black"
                                  : item.isSubItem
                                  ? "subitem-row print:bg-white print:text-black"
                                  : hasSubItems
                                  ? "mainitem-parent-row font-bold bg-slate-100 print:bg-white print:text-black"
                                  : "print:bg-white print:text-black"
                              }
                            >
                              {renderPrintCell(0, item.slNo, "col-slno font-bold print:text-black print:bg-white")}
                              {renderPrintCell(
                                1,
                                <div className={`particulars-print-text ${
                                  item.isDeduction
                                    ? "pl-4 text-rose-800 font-semibold print:text-black"
                                    : item.isSubItem
                                    ? "pl-4 italic print:text-black"
                                    : hasSubItems
                                    ? "font-bold print:text-black"
                                    : "print:text-black"
                                }`}>
                                  {item.isDeduction && !item.particulars.toLowerCase().startsWith("deduct")
                                    ? `↳ Deduct: ${item.particulars}`
                                    : item.isSubItem
                                    ? `↳ ${item.particulars}`
                                    : item.particulars}
                                </div>,
                                "col-particulars print:text-black print:bg-white"
                              )}
                              {renderPrintCell(2, hasSubItems ? "—" : item.nos || "-", "col-nos print:text-black print:bg-white")}
                              {renderPrintCell(3, hasSubItems ? "—" : item.length || "-", "col-l print:text-black print:bg-white")}
                              {renderPrintCell(4, hasSubItems ? "—" : item.breadth || "-", "col-b print:text-black print:bg-white")}
                              {renderPrintCell(5, hasSubItems ? "—" : item.depth || "-", "col-d print:text-black print:bg-white")}
                              {renderPrintCell(6, item.quantity, `col-qty font-bold print:text-black print:bg-white ${item.quantity < 0 ? "text-rose-700 print:text-black" : ""}`)}
                              {renderPrintCell(7, item.unit || "—", "col-unit print:text-black print:bg-white")}
                              {renderPrintCell(8, item.isSubItem ? "—" : item.rate ? item.rate.toLocaleString("en-IN") : "-", "col-rate print:text-black print:bg-white")}
                              {renderPrintCell(9, item.isSubItem ? "—" : `₹${item.amount.toLocaleString("en-IN")}`, "col-amount font-bold print:text-black print:bg-white")}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Provision under each Floor: Add Item & Add Sub Items Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 bg-slate-950/60 -mx-4 -mb-4 p-4 rounded-b-2xl print:hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddItem(blockIdx, appIdx)}
                        className="bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                        title="Add a new main Particulars of Work Item"
                      >
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>Add Item</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddSubItem(blockIdx, appIdx)}
                        className="bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/80 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                        title="Add Sub Item / measurement breakdown under this floor"
                      >
                        <CornerDownRight className="w-4 h-4 text-indigo-400" />
                        <span>Add Sub Items (+)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddDeductionSubItem(blockIdx, appIdx)}
                        className="bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-700/80 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                        title="Add Subtraction / Deduction Item (-) for Openings, Doors, Windows"
                      >
                        <Minus className="w-4 h-4 text-rose-400" />
                        <span>Add Deduction (-)</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span className="hidden sm:inline">
                        Total Items: <strong className="text-slate-200">{app.items.length}</strong>
                      </span>
                      <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                        Floor Total: <strong className="text-emerald-400 font-bold">₹{app.totalAmount.toLocaleString("en-IN")}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CPWD & PWD STATUTORY MARKUPS & TAXES BREAKDOWN */}
      {(normalizedProject.contractorProfitPercentage || normalizedProject.gstPercentage || normalizedProject.contingencyPercentage) ? (
        <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-4 print:bg-white print:border-black print:rounded-none no-break-inside">
          <div className="flex items-center justify-between border-b border-slate-800 print:border-black pb-2">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400 print:text-black" />
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest print:text-black">
                CPWD / PWD ABSTRACT OF COST &amp; STATUTORY MARKUPS
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 print:bg-transparent print:border-black print:text-black font-bold">
              {normalizedProject.scheduleOfRatesType || "CPWD DSR 2023"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            {/* Direct Cost */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 print:bg-transparent print:border-black space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block print:text-black">1. Base Civil Works:</span>
              <div className="text-white font-bold text-sm print:text-black">
                ₹{normalizedProject.totalAmount.toLocaleString("en-IN")}
              </div>
            </div>

            {/* Contractor Profit */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 print:bg-transparent print:border-black space-y-1">
              <span className="text-amber-400 text-[10px] uppercase block print:text-black">
                2. CP &amp; Overheads ({normalizedProject.contractorProfitPercentage ?? 15}%):
              </span>
              <div className="text-amber-300 font-bold text-sm print:text-black">
                + ₹{(normalizedProject.contractorProfitAmount ?? Math.round((normalizedProject.totalAmount * (normalizedProject.contractorProfitPercentage ?? 15)) / 100)).toLocaleString("en-IN")}
              </div>
            </div>

            {/* GST */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 print:bg-transparent print:border-black space-y-1">
              <span className="text-emerald-400 text-[10px] uppercase block print:text-black">
                3. Works GST ({normalizedProject.gstPercentage ?? 18}%):
              </span>
              <div className="text-emerald-300 font-bold text-sm print:text-black">
                + ₹{(normalizedProject.gstAmount ?? Math.round((normalizedProject.totalAmount * (normalizedProject.gstPercentage ?? 18)) / 100)).toLocaleString("en-IN")}
              </div>
            </div>

            {/* Contingencies */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 print:bg-transparent print:border-black space-y-1">
              <span className="text-cyan-400 text-[10px] uppercase block print:text-black">
                4. Contingency ({normalizedProject.contingencyPercentage ?? 3}%):
              </span>
              <div className="text-cyan-300 font-bold text-sm print:text-black">
                + ₹{(normalizedProject.contingencyAmount ?? Math.round((normalizedProject.totalAmount * (normalizedProject.contingencyPercentage ?? 3)) / 100)).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {((normalizedProject.waterChargesPercentage ?? 1) > 0 || (normalizedProject.cessPercentage ?? 1) > 0 || (normalizedProject.costIndexPercentage ?? 0) > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 print:text-black print:border-black">
              {(normalizedProject.waterChargesPercentage ?? 1) > 0 && (
                <span>
                  Water Supply ({normalizedProject.waterChargesPercentage ?? 1}%):{" "}
                  <strong className="text-blue-400 print:text-black">
                    + ₹{(normalizedProject.waterChargesAmount ?? Math.round((normalizedProject.totalAmount * (normalizedProject.waterChargesPercentage ?? 1)) / 100)).toLocaleString("en-IN")}
                  </strong>
                </span>
              )}
              {(normalizedProject.cessPercentage ?? 1) > 0 && (
                <span>
                  Labour Welfare Cess ({normalizedProject.cessPercentage ?? 1}%):{" "}
                  <strong className="text-purple-400 print:text-black">
                    + ₹{(normalizedProject.cessAmount ?? Math.round((normalizedProject.totalAmount * (normalizedProject.cessPercentage ?? 1)) / 100)).toLocaleString("en-IN")}
                  </strong>
                </span>
              )}
              {(normalizedProject.costIndexPercentage ?? 0) > 0 && (
                <span>
                  Cost Index Adjustment ({normalizedProject.costIndexPercentage}%):{" "}
                  <strong className="text-orange-400 print:text-black">
                    + ₹{(normalizedProject.costIndexAmount ?? Math.round((normalizedProject.totalAmount * (normalizedProject.costIndexPercentage || 0)) / 100)).toLocaleString("en-IN")}
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* UNFORESEEN EXPENSES & CONTINGENCIES ROW */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 print:bg-white print:border-black print:rounded-none no-break-inside">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block print:text-black">
              UNFORESEEN EXPENSES & CONTINGENCIES
            </span>
            <input
              type="text"
              value={normalizedProject.unforeseenDescription || "Unforeseen Expenses & Contingencies"}
              onChange={(e) => handleUnforeseenChange("unforeseenDescription", e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-sans focus:outline-none focus:border-amber-500 print:bg-transparent print:border-none print:text-black print:font-bold"
            />
          </div>

          <div className="flex items-center gap-3">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-0.5 print:text-black">Quantity Unit</label>
              <input
                type="text"
                value={normalizedProject.unforeseenQty || "LSM"}
                onChange={(e) => handleUnforeseenChange("unforeseenQty", e.target.value)}
                className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500 print:bg-transparent print:border-none print:text-black"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-0.5 print:text-black">Manually Typed Amount (₹)</label>
              <input
                type="number"
                value={normalizedProject.unforeseenAmount || 0}
                onChange={(e) => handleUnforeseenChange("unforeseenAmount", e.target.value)}
                className="w-36 bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-1.5 text-right text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400 print:bg-transparent print:border-none print:text-black"
              />
            </div>
          </div>
        </div>
      </div>

      {/* GRAND TOTAL ESTIMATED COST & FIGURES IN WORDS BOX */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl space-y-4 print:bg-white print:border-2 print:border-black print:rounded-none no-break-inside">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-emerald-800/60 pb-4 print:border-black">
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 print:text-black">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 print:hidden" />
              <span>GRAND ESTIMATED TOTAL COST</span>
            </div>
            <div className="text-3xl md:text-4xl font-black text-white font-mono print:text-black">
              ₹{grandTotalCost.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase print:text-gray-600">
              STRUCTURES SUBTOTAL: ₹{totalBeforeContingency.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] font-mono text-amber-300 uppercase print:text-black font-bold">
              + UNFORESEEN CONTINGENCIES: ₹{(normalizedProject.unforeseenAmount || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="p-3 bg-slate-950/80 border border-emerald-800/40 rounded-xl print:bg-gray-100 print:border-black">
          <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5 print:text-black font-bold">
            AMOUNT IN WORDS:
          </span>
          <div className="text-sm font-mono font-bold text-emerald-300 uppercase tracking-wide print:text-black">
            {grandTotalInWords}
          </div>
        </div>
      </div>

      {/* BOTTOM SIGNATURE & SEAL SECTION (APPLICANT / OWNER & AUTHORISED ENGINEER) */}
      <div className="pt-8 print:pt-4 border-t-2 border-slate-800 print:border-black print:mt-4 no-break-inside">
        <div className={`grid ${showEngineerDetails ? "grid-cols-2 gap-8 print:gap-8" : "grid-cols-1 max-w-lg"} items-end p-6 print:p-4 bg-slate-950/80 border border-slate-800 rounded-3xl print:bg-white print:border-black print:rounded-none`}>
          
          {/* Left Bottom: Applicant / Owner Signature */}
          <div className="space-y-6 print:space-y-4 text-left">
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase print:text-black">
                APPLICANT / OWNER SIGNATURE
              </div>
              <div className="h-28 print:h-24 border-b-2 border-dashed border-slate-700 w-64 print:border-black flex items-end pb-2">
                <span className="text-[11px] font-mono text-slate-500 italic print:text-gray-600">
                  (Signature of Applicant / Owner)
                </span>
              </div>
            </div>

            <div className="space-y-1 font-sans">
              <div className="text-sm font-bold text-white print:text-black">
                {normalizedProject.clientName}
              </div>
              <div className="text-xs text-slate-400 font-mono print:text-black">
                {normalizedProject.houseName}, {normalizedProject.postOffice}
              </div>
              <div className="text-xs text-slate-500 font-mono print:text-black">
                Phone: {normalizedProject.clientPhone}
              </div>
            </div>
          </div>

          {/* Right Bottom: Authorised Engineer Signature & Seal (Only if showEngineerDetails is true) */}
          {showEngineerDetails && (
            <div className="space-y-6 print:space-y-4 text-right flex flex-col items-end">
              <div className="space-y-2 text-right">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase print:text-black flex items-center justify-end gap-1.5">
                  {isAuthorizedSigner ? (
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700 print:hidden font-mono">
                      ✓ AUTHORIZED DIGITAL SIGNER ({activeEmail})
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 print:hidden font-mono">
                      PHYSICAL SIGNATURE
                    </span>
                  )}
                  <span>AUTHORISED ENGINEER SIGNATURE & SEAL</span>
                </div>
                <div className="h-28 print:h-24 border-b-2 border-dashed border-slate-700 w-72 ml-auto print:border-black flex items-end justify-end pb-2">
                  <span className="text-xs font-mono font-bold text-amber-300 print:text-black italic">
                    {stripEr(normalizedProject.preparedBy)}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-right font-sans">
                <div className="text-sm font-bold text-white print:text-black">
                  {stripEr(normalizedProject.preparedBy)}
                </div>
                <div className="text-xs text-slate-400 font-mono print:text-black">
                  Reg. No: {normalizedProject.regNo}
                </div>
                <div className="text-xs text-slate-500 font-mono print:text-black">
                  Department of LSGD / Urban Affairs Govt of Kerala
                </div>
                <div className="text-xs text-emerald-400 font-mono print:text-black font-bold">
                  Date: {normalizedProject.estimationDate}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
        </div>

        {/* ESTIMATE RIGHT SIDE DOCK (ALL OPTIONS, CELL EDIT/MERGE, CPWD MARKUPS, LIBRARY & AI) */}
        <EstimateSideDock
          project={normalizedProject}
          onUpdateProject={updateNormalized}
          isOpen={isAiDockOpen}
          onToggle={() => setIsAiDockOpen(!isAiDockOpen)}
          selectedCellRange={selectedCellRange}
          onSelectCellRange={setSelectedCellRange}
          onMergeCells={handleMergeCells}
          onMergeAcross={handleMergeAcross}
          onQuickMergeNosToUnit={handleQuickMergeNosToUnit}
          onUnmergeCells={handleUnmergeCells}
          onUpdateMergedValue={handleUpdateMergedValue}
          onItemChange={handleItemChange}
          onToggleDeduction={handleToggleDeduction}
          onToggleSubItem={handleToggleSubItem}
          onAddSubItemBelow={handleAddSubItem}
          onAddDeductionSubItem={handleAddDeductionSubItem}
          onDuplicateItem={handleDuplicateItem}
          onDeleteItem={handleDeleteItem}
          onSaveProject={handleManualSave}
          saveStatus={saveStatus}
          lastSavedTime={lastSavedTime}
          onPrint={handlePrint}
          onExportExcel={() => setIsExcelModalOpen(true)}
          onOpenAttachments={() => setIsAttachModalOpen(true)}
          onOpenQRModal={() => setIsQRModalOpen(true)}
          onOpenStageCertificates={onOpenStageCertificates}
          onConvertToProject={onConvertToProject}
          onConvertToInvoice={onConvertToInvoice}
          onOpenItemsOfWorkMaster={onOpenItemsOfWorkMaster}
          onAddFloorAppendix={handleAddAppendix}
          onAddBuildingBlock={handleAddBlock}
          onDuplicateProject={onDuplicateProject}
          onDeleteProject={onDeleteProject}
        />
      </div>

      {/* Modals */}
      <VerificationQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        project={normalizedProject}
      />

      <AttachmentsModal
        isOpen={isAttachModalOpen}
        onClose={() => setIsAttachModalOpen(false)}
        project={normalizedProject}
      />

      <ExcelExportImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        project={normalizedProject}
      />

      <ItemOfWorkSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onIncludeItems={handleIncludeItemsFromMaster}
        floorTitle={
          normalizedProject.blocks?.[searchTargetBlockIdx]?.appendices?.[searchTargetAppIdx]?.title ||
          "Selected Floor"
        }
        nextSlNo={
          (normalizedProject.blocks?.[searchTargetBlockIdx]?.appendices?.[searchTargetAppIdx]?.items?.filter(
            (it) => !it.isSubItem
          )?.length || 0) + 1
        }
      />

      {/* AI Document Clone Modal */}
      {isAiCloneModalOpen && (
        <AiEstimateCloneModal
          isOpen={true}
          onClose={() => setIsAiCloneModalOpen(false)}
          existingProjects={allProjects || []}
          onCloneSuccess={(clonedProj, openInEditor = true) => {
            updateNormalized(clonedProj);
            if (onSelectProject) {
              onSelectProject(clonedProj);
            }
          }}
        />
      )}
    </div>
  );
};
