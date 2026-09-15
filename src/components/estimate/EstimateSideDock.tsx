import React, { useState, useRef, useEffect } from "react";
import {
  EstimateProject,
  EstimateItem,
  MergedCellRange,
  normalizeProjectBlocks,
  deleteProjectMarkups,
  restoreCPWDMarkups,
  deleteIndividualMarkup
} from "../../data/estimateData";
import {
  CPWD_MARKUP_PRESETS,
  CPWD_DSR_SCHEDULE_OF_RATES,
  CPWDScheduleItem
} from "../../data/cpwdScheduleOfRatesData";
import {
  Bot,
  Send,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Layers,
  ArrowUpRight,
  HelpCircle,
  PlusCircle,
  Calculator,
  RefreshCw,
  Paperclip,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Play,
  Square,
  FileText,
  Trash2,
  Maximize2,
  X,
  UploadCloud,
  Check,
  Grid,
  Split,
  Edit3,
  Percent,
  Sliders,
  Printer,
  FileSpreadsheet,
  Award,
  FolderKanban,
  Receipt,
  QrCode,
  Save,
  Plus,
  Copy,
  Minus,
  Eye,
  ArrowDown,
  CornerDownRight,
  UserCheck,
  Building,
  Hash,
  Coins,
  PackagePlus,
  BookOpen,
  Search,
  Filter,
  Tag,
  ShieldCheck,
  Scale,
  TrendingUp,
  Info
} from "lucide-react";
import {
  speakText,
  stopSpeech,
  isSpeechSynthesisSupported,
  isSpeaking as checkIsSpeaking
} from "../../utils/audioSpeechHelper";

export interface PlanAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64
  previewUrl: string;
}

interface CommandHistoryItem {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  actionType?: string;
  attachments?: PlanAttachment[];
  previousProjectState?: EstimateProject;
}

export interface SelectedCellRange {
  blockIdx: number;
  appIdx: number;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface EstimateSideDockProps {
  project: EstimateProject;
  onUpdateProject: (updated: EstimateProject) => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;

  // Cell Selection & Merge/Unmerge Props
  selectedCellRange: SelectedCellRange | null;
  onSelectCellRange: (range: SelectedCellRange | null) => void;
  onMergeCells: (blockIdx?: number, appIdx?: number) => void;
  onMergeAcross: (blockIdx?: number, appIdx?: number) => void;
  onQuickMergeNosToUnit: (blockIdx: number, appIdx: number, rowIdx: number) => void;
  onUnmergeCells: (blockIdx?: number, appIdx?: number, specificRangeId?: string) => void;
  onUpdateMergedValue: (blockIdx: number, appIdx: number, rangeId: string, value: string) => void;

  // Item & Row Modification Props
  onItemChange: (blockIdx: number, appIdx: number, itemIdx: number, field: keyof EstimateItem, value: any) => void;
  onToggleDeduction: (blockIdx: number, appIdx: number, itemIdx: number) => void;
  onToggleSubItem: (blockIdx: number, appIdx: number, itemIdx: number) => void;
  onAddSubItemBelow?: (blockIdx: number, appIdx: number, parentItemIdx: number) => void;
  onAddDeductionSubItem?: (blockIdx: number, appIdx: number, parentItemIdx: number) => void;
  onDuplicateItem?: (blockIdx: number, appIdx: number, itemIdx: number) => void;
  onDeleteItem?: (blockIdx: number, appIdx: number, itemIdx: number) => void;

  // Project Actions
  onSaveProject?: () => void;
  saveStatus?: "saved" | "saving" | "unsaved";
  lastSavedTime?: Date;
  onPrint?: () => void;
  onExportExcel?: () => void;
  onOpenAttachments?: () => void;
  onOpenQRModal?: () => void;
  onOpenStageCertificates?: () => void;
  onConvertToProject?: (p: EstimateProject) => void;
  onConvertToInvoice?: (p: EstimateProject) => void;
  onOpenItemsOfWorkMaster?: () => void;
  onAddFloorAppendix?: (blockIdx: number) => void;
  onAddBuildingBlock?: () => void;
  onDuplicateProject?: (p: EstimateProject) => void;
  onDeleteProject?: (id: string) => void;
}

const COLUMN_NAMES = [
  "SL",
  "Particulars of Work",
  "NOS",
  "L (Length)",
  "B (Breadth)",
  "D (Depth)",
  "QTY (Quantity)",
  "Unit",
  "Rate (₹)",
  "Amount (₹)"
];

export const EstimateSideDock: React.FC<EstimateSideDockProps> = ({
  project,
  onUpdateProject,
  isOpen,
  onToggle,
  className = "",
  selectedCellRange,
  onSelectCellRange,
  onMergeCells,
  onMergeAcross,
  onQuickMergeNosToUnit,
  onUnmergeCells,
  onUpdateMergedValue,
  onItemChange,
  onToggleDeduction,
  onToggleSubItem,
  onAddSubItemBelow,
  onAddDeductionSubItem,
  onDuplicateItem,
  onDeleteItem,
  onSaveProject,
  saveStatus = "saved",
  lastSavedTime = new Date(),
  onPrint,
  onExportExcel,
  onOpenAttachments,
  onOpenQRModal,
  onOpenStageCertificates,
  onConvertToProject,
  onConvertToInvoice,
  onOpenItemsOfWorkMaster,
  onAddFloorAppendix,
  onAddBuildingBlock,
  onDuplicateProject,
  onDeleteProject
}) => {
  // Active Dock Tab
  const [activeDockTab, setActiveDockTab] = useState<"cell" | "options" | "rates" | "library" | "ai">("cell");

  // AI & Speech States
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastUndoState, setLastUndoState] = useState<EstimateProject | null>(null);
  const [lastSuccessMsg, setLastSuccessMsg] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<PlanAttachment[]>([]);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  // CPWD Schedule of Rates Filter & Search States
  const [ratesSearchQuery, setRatesSearchQuery] = useState("");
  const [selectedChapterNo, setSelectedChapterNo] = useState<number | "all">("all");
  const [activeRateType, setActiveRateType] = useState<"cpwd" | "kpwd" | "market">("cpwd");

  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      id: "init_msg",
      sender: "ai",
      text: `Namaskaram! I am your Vasthusilpy AI Quantity Surveyor & Plan Estimator.\n\n📎 Attach floor plans, area details, or blueprints to automatically generate Kerala PWD estimates.\n🔊 Audio output is supported — click the speaker icon on any message to listen to the estimate breakdown!\n\nTry: "Create estimate from attached plan", "Add 5% contingency", "Calculate RCC slab for 1500 sq.ft", or "Update plastering rate to ₹380/sqm".`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

  // When cells are selected, switch to cell tab only if dock is already open - do NOT auto-open or toggle dock
  useEffect(() => {
    if (selectedCellRange && isOpen) {
      setActiveDockTab("cell");
      if (tabContentRef.current) {
        tabContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [selectedCellRange, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  // Speech recognition initialization for microphone input
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = "en-IN";

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recog.onerror = () => {
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }

    return () => {
      stopSpeech();
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Audio Playback Handlers
  const handleToggleSpeech = (msgId: string, text: string) => {
    if (activeSpeakingId === msgId) {
      stopSpeech();
      setActiveSpeakingId(null);
    } else {
      stopSpeech();
      setActiveSpeakingId(msgId);
      const cleanText = text
        .replace(/[*_#`~]/g, "")
        .replace(/₹/g, "Rupees ")
        .replace(/\n+/g, ". ");

      speakText(cleanText, {
        lang: "ml-IN",
        onEnd: () => setActiveSpeakingId(null),
        onError: () => setActiveSpeakingId(null)
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload image format floor plans (PNG, JPG, WEBP).");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = (event.target?.result as string) || "";
        const newAttachment: PlanAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data,
          previewUrl: base64Data
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSendCommand = async (presetText?: string) => {
    const query = presetText || input;
    if (!query.trim() && attachments.length === 0) return;

    const userMsg: CommandHistoryItem = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    setHistory((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);
    setLastSuccessMsg(null);

    try {
      const response = await fetch("/api/ai/estimate-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: query,
          project,
          attachments: attachments.map((a) => ({
            name: a.name,
            data: a.data,
            type: a.type
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.updatedProject) {
        setLastUndoState(JSON.parse(JSON.stringify(project)));
        onUpdateProject(data.updatedProject);
      }

      const aiMsg: CommandHistoryItem = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: data.explanation || "Estimate updated successfully as requested.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionType: data.actionType
      };

      setHistory((prev) => [...prev, aiMsg]);
      setLastSuccessMsg(data.explanation || "Project updated!");
      setAttachments([]);

      if (autoSpeak && data.explanation) {
        handleToggleSpeech(aiMsg.id, data.explanation);
      }
    } catch (err: any) {
      console.error("AI command failed:", err);
      setError(err.message || "Failed to process command. Please try again.");
      setHistory((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: "ai",
          text: `⚠️ Error executing command: ${err.message || "Please check network connection"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (lastUndoState) {
      onUpdateProject(lastUndoState);
      setLastUndoState(null);
      setLastSuccessMsg("Reverted previous AI modification.");
    }
  };

  // Helper to extract selected item data
  const currentBlock = selectedCellRange ? project.blocks?.[selectedCellRange.blockIdx] : undefined;
  const currentApp = selectedCellRange && currentBlock ? currentBlock.appendices?.[selectedCellRange.appIdx] : undefined;
  const selectedItem = selectedCellRange && currentApp ? currentApp.items?.[selectedCellRange.startRow] : undefined;

  const minRow = selectedCellRange ? Math.min(selectedCellRange.startRow, selectedCellRange.endRow) : 0;
  const maxRow = selectedCellRange ? Math.max(selectedCellRange.startRow, selectedCellRange.endRow) : 0;
  const minCol = selectedCellRange ? Math.min(selectedCellRange.startCol, selectedCellRange.endCol) : 0;
  const maxCol = selectedCellRange ? Math.max(selectedCellRange.startCol, selectedCellRange.endCol) : 0;

  const totalCellsSelected = selectedCellRange ? (maxRow - minRow + 1) * (maxCol - minCol + 1) : 0;
  const isMultiCell = totalCellsSelected > 1;

  // Find if current selection is part of a merged range
  const currentMergedRange = currentApp?.mergedRanges?.find((r) => {
    const rMinR = Math.min(r.startRow, r.endRow);
    const rMaxR = Math.max(r.startRow, r.endRow);
    const rMinC = Math.min(r.startCol, r.endCol);
    const rMaxC = Math.max(r.startCol, r.endCol);
    return minRow <= rMaxR && maxRow >= rMinR && minCol <= rMaxC && maxCol >= rMinC;
  });

  return (
    <>
      {/* Mobile Drawer Backdrop when Open */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity print:hidden"
        />
      )}

      {/* Dock Toggle Floating Handle (When dock is closed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-0 top-1/3 -translate-y-1/2 z-40 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-l-2xl shadow-2xl flex flex-col items-center gap-1.5 border-y border-l border-indigo-400/50 cursor-pointer group transition-all print:hidden"
          title="Open Estimate Right Dock (Live Options, CPWD & Excel Tools)"
        >
          <Sliders className="w-5 h-5 group-hover:scale-110 transition-transform text-amber-300" />
          <span className="[writing-mode:vertical-rl] font-mono text-[11px] font-bold tracking-wider uppercase text-slate-100">
            Estimate Dock
          </span>
          {selectedCellRange && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping mt-1" />
          )}
        </button>
      )}

      {/* Main Side Dock Drawer: Side-by-side on desktop (zero overlap with estimate), slide-over on mobile */}
      <aside
        id="estimate-side-dock"
        className={`print:hidden ${
          isOpen
            ? "lg:sticky lg:top-20 lg:h-[calc(100vh-5.5rem)] lg:w-[390px] xl:w-[430px] lg:shrink-0 lg:rounded-2xl lg:border lg:border-slate-800 max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:z-50 max-lg:h-full max-lg:w-full max-lg:max-w-[420px] max-lg:border-l max-lg:border-slate-800 bg-slate-950/98 backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
            : "hidden"
        } ${className}`}
      >
        {/* Dock Header */}
        <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-950 border border-indigo-700/80 rounded-xl text-indigo-300">
              <Sliders className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="font-mono text-xs font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                <span>ESTIMATE RIGHT DOCK</span>
                <span className="hidden lg:inline-flex px-1.5 py-0.2 rounded bg-indigo-950/90 border border-indigo-700/60 text-indigo-300 text-[8.5px] font-mono">
                  NO OVERLAP
                </span>
                {saveStatus === "saved" ? (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-700 text-emerald-400 text-[9px] font-mono">
                    SAVED
                  </span>
                ) : saveStatus === "saving" ? (
                  <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-700 text-amber-400 text-[9px] font-mono animate-pulse">
                    SAVING...
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded bg-rose-950 border border-rose-700 text-rose-400 text-[9px] font-mono">
                    UNSAVED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Spreadsheet cell tools, rates, library & AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onSaveProject && (
              <button
                onClick={onSaveProject}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                title="Save Estimate Changes"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}
            <button
              onClick={onToggle}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700 shadow-sm"
              title="Collapse Side Dock (Keep Closed)"
            >
              <span className="text-[10.5px]">Collapse</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dock Navigation Sub-Tabs */}
        <div className="flex items-center justify-between bg-slate-900/90 border-b border-slate-800/80 px-2 py-1.5 gap-1 shrink-0 overflow-x-auto text-[11px] font-mono">
          <button
            onClick={() => setActiveDockTab("cell")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeDockTab === "cell"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-indigo-300" />
            <span>Cell / Merge</span>
            {selectedCellRange && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveDockTab("options")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeDockTab === "options"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-300" />
            <span>Options</span>
          </button>

          <button
            onClick={() => setActiveDockTab("rates")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeDockTab === "rates"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-amber-300" />
            <span>CPWD & Markups</span>
            {(project.contractorProfitPercentage || project.gstPercentage) ? (
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                {project.contractorProfitPercentage ?? 15}%+{project.gstPercentage ?? 18}%
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveDockTab("library")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeDockTab === "library"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
            <span>DSR &amp; Rates</span>
          </button>

          <button
            onClick={() => setActiveDockTab("ai")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeDockTab === "ai"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-300" />
            <span>AI Assistant</span>
          </button>
        </div>

        {/* Scrollable Tab Content Container */}
        <div ref={tabContentRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
          
          {/* ========================================================================= */}
          {/* TAB 1: CELL EDITING, MERGE & UNMERGE CONTROLS */}
          {/* ========================================================================= */}
          {activeDockTab === "cell" && (
            <div className="space-y-4">
              {/* Selection Status Banner */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                selectedCellRange
                  ? "bg-indigo-950/60 border-indigo-700/80 shadow-md"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-indigo-400" />
                    <span>Active Cell Settings</span>
                  </span>
                  {selectedCellRange ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/80 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Dock Active at Right</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">None Selected</span>
                  )}
                </div>

                {selectedCellRange ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-mono bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-1.5 rounded-xl">
                      <span className="text-slate-200 font-bold truncate max-w-[220px]">
                        Row {minRow + 1}: {selectedItem?.particulars || "Selected Item"}
                      </span>
                      <span className="text-emerald-400 font-bold text-[10px]">
                        {totalCellsSelected} Cell{totalCellsSelected > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-0.5 font-mono text-[11px]">
                      <div className="text-slate-300">
                        <strong>Location:</strong> {currentBlock?.title || "Main Building"} &gt; {currentApp?.title || "Floor"}
                      </div>
                      <div className="text-indigo-300">
                        <strong>Coordinates:</strong> Row {minRow + 1}{minRow !== maxRow ? ` → ${maxRow + 1}` : ""} | Cols: {COLUMN_NAMES[minCol]} → {COLUMN_NAMES[maxCol]}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-1.5 flex-wrap border-t border-indigo-900/60">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCellRange) {
                            const rowEl = document.getElementById(
                              `estimate-row-${selectedCellRange.blockIdx}-${selectedCellRange.appIdx}-${minRow}`
                            );
                            if (rowEl) {
                              rowEl.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                          }
                        }}
                        className="text-[10px] font-mono text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        title="Center selected row and right dock settings side-by-side in viewport"
                      >
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>Center Row {minRow + 1}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedCellRange) {
                              onQuickMergeNosToUnit(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow);
                            }
                          }}
                          className="text-[10px] font-mono text-indigo-200 hover:text-white bg-indigo-900/80 hover:bg-indigo-800 px-2 py-1 rounded-lg border border-indigo-700 cursor-pointer transition-colors"
                          title="Quick Merge NOS to UNIT"
                        >
                          ⚡ Quick Merge
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectCellRange(null)}
                          className="text-[10px] font-mono text-slate-400 hover:text-slate-200 underline cursor-pointer px-1"
                        >
                          Clear (Esc)
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    Click any cell or drag across multiple columns in the estimate sheet table to edit, merge, or unmerge cells here automatically.
                  </p>
                )}
              </div>

              {/* Merge & Unmerge Action Buttons */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Split className="w-4 h-4 text-emerald-400" />
                    <span>Merge &amp; Unmerge Tools</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!selectedCellRange || !isMultiCell}
                    onClick={() => {
                      if (selectedCellRange) {
                        onMergeCells(selectedCellRange.blockIdx, selectedCellRange.appIdx);
                      }
                    }}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    title="Merge selected cells into one unified cell"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Merge Selected</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedCellRange}
                    onClick={() => {
                      if (selectedCellRange) {
                        onMergeAcross(selectedCellRange.blockIdx, selectedCellRange.appIdx);
                      }
                    }}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-indigo-300 border border-indigo-700/60 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    title="Merge columns across each row individually"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Merge Across Rows</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedCellRange}
                    onClick={() => {
                      if (selectedCellRange) {
                        onUnmergeCells(selectedCellRange.blockIdx, selectedCellRange.appIdx);
                      }
                    }}
                    className="p-2.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/70 disabled:opacity-40 disabled:hover:bg-amber-950/80 text-amber-300 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    title="Split selected merged cell range back into individual cells"
                  >
                    <Split className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unmerge Selected</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedCellRange && !project.blocks?.some((b) => b.appendices?.some((a) => a.mergedRanges && a.mergedRanges.length > 0))}
                    onClick={() => {
                      const bIdx = selectedCellRange?.blockIdx ?? 0;
                      const aIdx = selectedCellRange?.appIdx ?? 0;
                      onUnmergeCells(bIdx, aIdx);
                    }}
                    className="p-2.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-800 disabled:opacity-40 disabled:hover:bg-rose-950/70 text-rose-300 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    title="Unmerge all cells across this floor"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Unmerge Floor</span>
                  </button>
                </div>

                {/* If selected cell has a merged range, allow editing its note */}
                {currentMergedRange && selectedCellRange && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <label className="text-[11px] font-mono text-indigo-300 font-bold block">
                      Merged Cell Label / Specification Note:
                    </label>
                    <input
                      type="text"
                      value={currentMergedRange.mergedValue || ""}
                      onChange={(e) =>
                        onUpdateMergedValue(
                          selectedCellRange.blockIdx,
                          selectedCellRange.appIdx,
                          currentMergedRange.id,
                          e.target.value
                        )
                      }
                      placeholder="e.g. Lump Sum / As per site measurement..."
                      className="w-full bg-slate-950 border border-indigo-600 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                )}
              </div>

              {/* Direct Live Cell Editor for Selected Item */}
              {selectedItem && selectedCellRange && (
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-cyan-400" />
                      <span>Edit Row #{minRow + 1} Data</span>
                    </h4>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      selectedItem.isDeduction
                        ? "bg-rose-950 text-rose-400 border border-rose-800"
                        : selectedItem.isSubItem
                        ? "bg-indigo-950 text-indigo-400 border border-indigo-800"
                        : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    }`}>
                      {selectedItem.isDeduction ? "[-] DEDUCTION" : selectedItem.isSubItem ? "[+] SUB-ITEM" : "MAIN ITEM"}
                    </span>
                  </div>

                  {/* Serial Number & Particulars */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">SL No</label>
                        <input
                          type="text"
                          value={selectedItem.slNo}
                          onChange={(e) =>
                            onItemChange(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow, "slNo", e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Unit</label>
                        <input
                          type="text"
                          value={selectedItem.unit}
                          onChange={(e) =>
                            onItemChange(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow, "unit", e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Rate (₹)</label>
                        <input
                          type="number"
                          value={selectedItem.rate}
                          onChange={(e) =>
                            onItemChange(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow, "rate", Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-right focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Particulars of Work</label>
                      <textarea
                        rows={2}
                        value={selectedItem.particulars}
                        onChange={(e) =>
                          onItemChange(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow, "particulars", e.target.value)
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white leading-relaxed focus:outline-none focus:border-emerald-500 resize-none font-sans"
                      />
                    </div>

                    {/* Numeric Dimensions Grid */}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">NOS</label>
                        <input
                          type="number"
                          step="any"
                          value={selectedItem.nos}
                          onChange={(e) =>
                            onItemChange(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow, "nos", Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">L (m)</label>
                        <input
                          type="number"
                          step="any"
                          value={selectedItem.length}
                          onChange={(e) =>
                            onItemChange(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow, "length", Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-right focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">B (m)</label>
                        <input
                          type="number"
                          step="any"
                          value={selectedItem.breadth}
                          onChange={(e) =>
                            onItemChange(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow, "breadth", Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-right focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">D (m)</label>
                        <input
                          type="number"
                          step="any"
                          value={selectedItem.depth}
                          onChange={(e) =>
                            onItemChange(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow, "depth", Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-right focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Quantity & Total Amount Summary Card */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                          <span>Total Quantity</span>
                          {selectedItem.isManualQty && (
                            <span className="text-[8px] bg-amber-900/90 text-amber-300 border border-amber-600/70 px-1 rounded uppercase font-mono font-bold">
                              MANUAL
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="number"
                            step="any"
                            value={selectedItem.quantity === 0 ? "" : selectedItem.quantity}
                            placeholder="0"
                            onChange={(e) =>
                              onItemChange(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow, "quantity", e.target.value)
                            }
                            className="w-24 bg-slate-900 border border-amber-500/60 rounded px-2 py-0.5 text-sm font-black font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                            title="Directly edit Quantity"
                          />
                          <span className="text-xs font-mono text-slate-400">{selectedItem.unit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-slate-400">Total Amount</div>
                        <div className="text-sm font-black font-mono text-emerald-400">
                          ₹{Math.round(selectedItem.amount).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row Structure & Modifier Buttons */}
                  <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleDeduction(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow)}
                      className={`p-2 rounded-xl border font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        selectedItem.isDeduction
                          ? "bg-rose-900/80 text-rose-200 border-rose-700 hover:bg-rose-800"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:text-rose-300"
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>{selectedItem.isDeduction ? "Remove Deduction" : "Mark Deduction (-)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleSubItem(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow)}
                      className={`p-2 rounded-xl border font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        selectedItem.isSubItem
                          ? "bg-indigo-900/80 text-indigo-200 border-indigo-700 hover:bg-indigo-800"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:text-indigo-300"
                      }`}
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>{selectedItem.isSubItem ? "Make Main Item" : "Make Sub-Item"}</span>
                    </button>

                    {onAddSubItemBelow && (
                      <button
                        type="button"
                        onClick={() => onAddSubItemBelow(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>+ Add Sub-Item</span>
                      </button>
                    )}

                    {onAddDeductionSubItem && (
                      <button
                        type="button"
                        onClick={() => onAddDeductionSubItem(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5 text-rose-400" />
                        <span>- Add Void/Deduct</span>
                      </button>
                    )}

                    {onDuplicateItem && (
                      <button
                        type="button"
                        onClick={() => onDuplicateItem(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicate Row</span>
                      </button>
                    )}

                    {onDeleteItem && (
                      <button
                        type="button"
                        onClick={() => onDeleteItem(selectedCellRange.blockIdx, selectedCellRange.appIdx, minRow)}
                        className="p-2 bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Row</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* List of Merged Ranges in current Floor */}
              {currentApp?.mergedRanges && currentApp.mergedRanges.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Merged Areas on this Floor ({currentApp.mergedRanges.length}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onUnmergeCells(selectedCellRange?.blockIdx ?? 0, selectedCellRange?.appIdx ?? 0)}
                      className="text-amber-400 hover:text-amber-300 text-[10px] underline cursor-pointer"
                    >
                      Unmerge All
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {currentApp.mergedRanges.map((range, idx) => (
                      <div
                        key={range.id || idx}
                        className="p-2 bg-slate-950 rounded-xl border border-indigo-900/60 flex items-center justify-between gap-2 text-xs font-mono"
                      >
                        <div>
                          <div className="text-indigo-300 font-bold">
                            Row {range.startRow + 1} (Cols {COLUMN_NAMES[range.startCol]} → {COLUMN_NAMES[range.endCol]})
                          </div>
                          {range.mergedValue && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              Note: {range.mergedValue}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onUnmergeCells(selectedCellRange?.blockIdx ?? 0, selectedCellRange?.appIdx ?? 0, range.id)}
                          className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Split className="w-3 h-3" />
                          <span>Unmerge</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ESTIMATE OPTIONS & ACTIONS */}
          {/* ========================================================================= */}
          {activeDockTab === "options" && (
            <div className="space-y-4">
              {/* Project Quick Overview */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-cyan-400" />
                    <span>Project Overview</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[10px]">
                    ID: {project.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850">
                    <div className="text-[10px] text-slate-400">Client Name</div>
                    <div className="font-bold text-white truncate">{project.clientName || "Client"}</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850">
                    <div className="text-[10px] text-slate-400">Plinth Area</div>
                    <div className="font-bold text-cyan-400">{project.plinthAreaSqFt} Sq.Ft</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850">
                    <div className="text-[10px] text-slate-400">Estimated Total</div>
                    <div className="font-bold text-emerald-400">₹{project.grandTotal.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850">
                    <div className="text-[10px] text-slate-400">Rate / Sq.Ft</div>
                    <div className="font-bold text-amber-400">
                      ₹{project.plinthAreaSqFt > 0 ? Math.round(project.grandTotal / project.plinthAreaSqFt) : 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimate Operations Grid */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
                <h4 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Estimate Actions</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                  {onPrint && (
                    <button
                      onClick={onPrint}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print A4 Estimate</span>
                    </button>
                  )}

                  {onExportExcel && (
                    <button
                      onClick={onExportExcel}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Excel Export / Import</span>
                    </button>
                  )}

                  {onOpenStageCertificates && (
                    <button
                      onClick={onOpenStageCertificates}
                      className="p-2.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/70 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Stage Certificate</span>
                    </button>
                  )}

                  {onOpenAttachments && (
                    <button
                      onClick={onOpenAttachments}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Paperclip className="w-4 h-4 text-cyan-400" />
                      <span>Attachments ({project.attachments?.length || 0})</span>
                    </button>
                  )}

                  {onConvertToProject && (
                    <button
                      onClick={() => onConvertToProject(project)}
                      className="p-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/70 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <FolderKanban className="w-4 h-4 text-emerald-400" />
                      <span>Convert to Project</span>
                    </button>
                  )}

                  {onConvertToInvoice && (
                    <button
                      onClick={() => onConvertToInvoice(project)}
                      className="p-2.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/70 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Receipt className="w-4 h-4 text-cyan-400" />
                      <span>Convert to Invoice</span>
                    </button>
                  )}

                  {onOpenQRModal && (
                    <button
                      onClick={onOpenQRModal}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <QrCode className="w-4 h-4 text-indigo-400" />
                      <span>Verification QR</span>
                    </button>
                  )}

                  {onDuplicateProject && (
                    <button
                      onClick={() => onDuplicateProject(project)}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Duplicate Project</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Structure Building Hierarchy Buttons */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
                <h4 className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span>Building Blocks &amp; Floors</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                  {onAddFloorAppendix && (
                    <button
                      onClick={() => onAddFloorAppendix(selectedCellRange?.blockIdx ?? 0)}
                      className="p-2.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/80 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span>+ Add New Floor</span>
                    </button>
                  )}

                  {onAddBuildingBlock && (
                    <button
                      onClick={onAddBuildingBlock}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Building className="w-4 h-4 text-cyan-400" />
                      <span>+ Add New Block</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CPWD MULTIPLIERS, TAXES & MARKUPS */}
          {/* ========================================================================= */}
          {activeDockTab === "rates" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/95 border border-slate-800 rounded-2xl space-y-4 font-mono text-xs shadow-xl">
                {/* Header with Title & Tag */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-400" />
                    <span>CPWD / PWD Markups &amp; Taxes</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {project.hasMarkups === false || (project.contractorProfitPercentage === 0 && project.gstPercentage === 0 && project.contingencyPercentage === 0) ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60 font-bold">
                        Markups Deleted (0%)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 font-bold">
                        Official Norms Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Global Action: Delete All Markups OR Restore CPWD Markups Banner */}
                {project.hasMarkups === false || (project.contractorProfitPercentage === 0 && project.gstPercentage === 0 && project.contingencyPercentage === 0 && (project.waterChargesPercentage ?? 0) === 0 && (project.cessPercentage ?? 0) === 0) ? (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/70 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-[11px] font-sans">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>CPWD / PWD Markups &amp; Taxes are Removed</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      Estimate Grand Total is now strictly calculated from direct base civil works items (0% CP, 0% GST, 0% Contingency).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = restoreCPWDMarkups(project);
                        onUpdateProject(updated);
                      }}
                      className="w-full py-2 px-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>✨ Restore CPWD Standard Markups (15% CP + 18% GST + 3% Cont)</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-sans">
                      <span className="font-bold flex items-center gap-1.5 text-slate-200">
                        <Scale className="w-4 h-4 text-amber-400" />
                        <span>Statutory Markups Control</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = deleteProjectMarkups(project);
                          onUpdateProject(updated);
                        }}
                        className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/80 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                        title="Remove all statutory markups, taxes, and overheads from calculation"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>Delete All Markups &amp; Taxes</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Clicking "Delete All Markups" resets all statutory percentages to 0% and computes pure direct material/labour cost.
                    </p>
                  </div>
                )}

                {/* 1-Click Standard Preset Norms */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-sans">
                    <span className="font-bold flex items-center gap-1 text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>1-Click Standard Presets</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Select Norm</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {CPWD_MARKUP_PRESETS.map((preset) => {
                      const isActive =
                        project.hasMarkups !== false &&
                        project.contractorProfitPercentage === preset.contractorProfitPercentage &&
                        project.gstPercentage === preset.gstPercentage &&
                        project.contingencyPercentage === preset.contingencyPercentage &&
                        (project.waterChargesPercentage ?? 1) === preset.waterChargesPercentage &&
                        (project.cessPercentage ?? 1) === preset.cessPercentage;

                      const isZeroPreset = preset.contractorProfitPercentage === 0 && preset.gstPercentage === 0;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            if (isZeroPreset) {
                              const updated = deleteProjectMarkups(project);
                              onUpdateProject(updated);
                            } else {
                              const updated = {
                                ...project,
                                hasMarkups: true,
                                scheduleOfRatesType: preset.scheduleOfRatesType,
                                contractorProfitPercentage: preset.contractorProfitPercentage,
                                gstPercentage: preset.gstPercentage,
                                contingencyPercentage: preset.contingencyPercentage,
                                waterChargesPercentage: preset.waterChargesPercentage,
                                cessPercentage: preset.cessPercentage,
                                costIndexPercentage: preset.costIndexPercentage,
                                includeMarkupsInGrandTotal: true
                              };
                              onUpdateProject(normalizeProjectBlocks(updated));
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isActive || (isZeroPreset && project.hasMarkups === false)
                              ? isZeroPreset
                                ? "bg-rose-950/80 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/50"
                                : "bg-amber-950/80 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50"
                              : "bg-slate-950/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-[11px] truncate flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                {isZeroPreset && <Trash2 className="w-3 h-3 text-rose-400" />}
                                {preset.name.split("(")[0]}
                              </span>
                              {(isActive || (isZeroPreset && project.hasMarkups === false)) && (
                                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">{preset.tagline}</div>
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono">
                            <span className={preset.contractorProfitPercentage > 0 ? "text-amber-400 font-bold" : "text-slate-400"}>
                              CP: {preset.contractorProfitPercentage}%
                            </span>
                            <span className={preset.gstPercentage > 0 ? "text-emerald-400 font-bold" : "text-slate-400"}>
                              GST: {preset.gstPercentage}%
                            </span>
                            <span className={preset.contingencyPercentage > 0 ? "text-cyan-400 font-bold" : "text-slate-400"}>
                              Cont: {preset.contingencyPercentage}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule of Rates System Selector */}
                <div className="space-y-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-sans flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Schedule of Rates Standard:</span>
                    </span>
                  </div>
                  <select
                    value={project.scheduleOfRatesType || "CPWD_DSR_2023"}
                    onChange={(e) => {
                      const updated = {
                        ...project,
                        scheduleOfRatesType: e.target.value as any
                      };
                      onUpdateProject(normalizeProjectBlocks(updated));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="CPWD_DSR_2023">CPWD Delhi Schedule of Rates (DSR 2023/24 - Latest)</option>
                    <option value="KPWD_PRICE_2024">Kerala PWD PRICE 2024 (DSR + Kerala Cost Index)</option>
                    <option value="CPWD_DSR_2021">CPWD DSR 2021 (Previous Baseline)</option>
                    <option value="MARKET_RATE_2025">Market Execution Rates 2025</option>
                  </select>
                </div>

                {/* Include Markups in Grand Total Switch */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="text-xs font-bold text-slate-200 font-sans flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Apply Markups to Grand Total</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Includes Contractor Profit, GST &amp; Markups in the printed bill
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newInclude = project.includeMarkupsInGrandTotal === false;
                      const updated = {
                        ...project,
                        includeMarkupsInGrandTotal: newInclude,
                        hasMarkups: newInclude ? true : project.hasMarkups
                      };
                      onUpdateProject(normalizeProjectBlocks(updated));
                    }}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      project.includeMarkupsInGrandTotal !== false ? "bg-emerald-600 justify-end" : "bg-slate-800 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                  </button>
                </div>

                {/* 1. Contractor Profit % */}
                <div className="space-y-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-sans">Contractor Profit &amp; Overheads (CP &amp; OH):</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold text-sm">
                        {project.contractorProfitPercentage ?? 15}%
                      </span>
                      {(project.contractorProfitPercentage ?? 15) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = deleteIndividualMarkup(project, "contractorProfit");
                            onUpdateProject(updated);
                          }}
                          className="px-1.5 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[9px] font-mono flex items-center gap-0.5 cursor-pointer"
                          title="Delete Contractor Profit (Set 0%)"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>0%</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="0.5"
                    value={project.contractorProfitPercentage ?? 15}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const updated = {
                        ...project,
                        contractorProfitPercentage: val,
                        hasMarkups: val > 0 ? true : project.hasMarkups
                      };
                      onUpdateProject(normalizeProjectBlocks(updated));
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between items-center text-[10px] pt-1">
                    {[0, 7.5, 10, 15, 20].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...project,
                            contractorProfitPercentage: val,
                            hasMarkups: val > 0 ? true : project.hasMarkups
                          };
                          onUpdateProject(normalizeProjectBlocks(updated));
                        }}
                        className={`px-2 py-0.5 rounded border text-[9px] cursor-pointer transition-all ${
                          (project.contractorProfitPercentage ?? 15) === val
                            ? "bg-amber-600 text-slate-950 border-amber-500 font-black"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {val === 0 ? "0% (Delete)" : val === 15 ? "15% (CPWD)" : val === 10 ? "10% (KPWD)" : `${val}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. GST % */}
                <div className="space-y-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-sans">Goods &amp; Service Tax (GST on Works):</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold text-sm">
                        {project.gstPercentage ?? 18}%
                      </span>
                      {(project.gstPercentage ?? 18) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = deleteIndividualMarkup(project, "gst");
                            onUpdateProject(updated);
                          }}
                          className="px-1.5 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[9px] font-mono flex items-center gap-0.5 cursor-pointer"
                          title="Delete GST (Set 0%)"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>0%</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 5, 12, 18].map((gstVal) => (
                      <button
                        key={gstVal}
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...project,
                            gstPercentage: gstVal,
                            hasMarkups: gstVal > 0 ? true : project.hasMarkups
                          };
                          onUpdateProject(normalizeProjectBlocks(updated));
                        }}
                        className={`py-1.5 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
                          (project.gstPercentage ?? 18) === gstVal
                            ? "bg-emerald-600 text-slate-950 border-emerald-500 font-black shadow-sm"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {gstVal === 0 ? "0% (Delete)" : `${gstVal}%`}
                        {gstVal === 18 && <span className="block text-[8px] font-normal">Works</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Contingency % */}
                <div className="space-y-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-sans">Unforeseen Contingencies:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold text-sm">
                        {project.contingencyPercentage ?? 3}%
                      </span>
                      {(project.contingencyPercentage ?? 3) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = deleteIndividualMarkup(project, "contingency");
                            onUpdateProject(updated);
                          }}
                          className="px-1.5 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[9px] font-mono flex items-center gap-0.5 cursor-pointer"
                          title="Delete Contingency (Set 0%)"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>0%</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={project.contingencyPercentage ?? 3}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const updated = {
                        ...project,
                        contingencyPercentage: val,
                        hasMarkups: val > 0 ? true : project.hasMarkups
                      };
                      onUpdateProject(normalizeProjectBlocks(updated));
                    }}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between items-center text-[10px] pt-1">
                    {[0, 2.5, 3, 5, 10].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...project,
                            contingencyPercentage: val,
                            hasMarkups: val > 0 ? true : project.hasMarkups
                          };
                          onUpdateProject(normalizeProjectBlocks(updated));
                        }}
                        className={`px-2 py-0.5 rounded border text-[9px] cursor-pointer transition-all ${
                          (project.contingencyPercentage ?? 3) === val
                            ? "bg-cyan-600 text-slate-950 border-cyan-500 font-black"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {val === 0 ? "0% (Delete)" : val === 3 ? "3% (CPWD)" : val === 5 ? "5% (KPWD)" : `${val}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Water & Sanitation Charges (1%) & Labour Welfare Cess (1%) */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-sans">Water Supply:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-blue-400 font-bold">{project.waterChargesPercentage ?? 1}%</span>
                        {(project.waterChargesPercentage ?? 1) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = deleteIndividualMarkup(project, "water");
                              onUpdateProject(updated);
                            }}
                            className="p-0.5 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                            title="Delete Water Charges"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.5"
                      value={project.waterChargesPercentage ?? 1}
                      onChange={(e) => {
                        const updated = {
                          ...project,
                          waterChargesPercentage: Number(e.target.value)
                        };
                        onUpdateProject(normalizeProjectBlocks(updated));
                      }}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-sans">Labour Cess:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-purple-400 font-bold">{project.cessPercentage ?? 1}%</span>
                        {(project.cessPercentage ?? 1) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = deleteIndividualMarkup(project, "cess");
                              onUpdateProject(updated);
                            }}
                            className="p-0.5 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                            title="Delete Labour Cess"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.5"
                      value={project.cessPercentage ?? 1}
                      onChange={(e) => {
                        const updated = {
                          ...project,
                          cessPercentage: Number(e.target.value)
                        };
                        onUpdateProject(normalizeProjectBlocks(updated));
                      }}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 5. Regional Cost Index Factor */}
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-sans">Regional Cost Index Factor:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-orange-400 font-bold">{project.costIndexPercentage ?? 0}%</span>
                      {(project.costIndexPercentage ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = deleteIndividualMarkup(project, "costIndex");
                            onUpdateProject(updated);
                          }}
                          className="px-1.5 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[9px] font-mono flex items-center gap-0.5 cursor-pointer"
                          title="Delete Cost Index"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>0%</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={project.costIndexPercentage ?? 0}
                    onChange={(e) => {
                      const updated = {
                        ...project,
                        costIndexPercentage: Number(e.target.value)
                      };
                      onUpdateProject(normalizeProjectBlocks(updated));
                    }}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>0% (Delhi Base)</span>
                    <span>+18.5%</span>
                    <span>+32.5% (Kerala PWD)</span>
                    <span>+50%</span>
                  </div>
                </div>

                {/* Itemized CPWD Abstract of Cost Breakdown Summary Card */}
                <div className="p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 space-y-2.5 shadow-inner">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span>Official Abstract of Cost</span>
                    <span className="text-[10px] text-slate-400 font-normal">CPWD Master Format</span>
                  </div>

                  <div className="flex justify-between text-slate-300 text-xs">
                    <span>1. Basic Civil Works (Direct Cost):</span>
                    <span className="font-bold text-white">₹{project.totalAmount.toLocaleString("en-IN")}</span>
                  </div>

                  {project.hasMarkups !== false && (project.contractorProfitPercentage ?? 15) > 0 && (
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>2. Contractor Profit &amp; Overheads ({project.contractorProfitPercentage ?? 15}%):</span>
                      <span className="text-amber-400 font-mono">
                        + ₹{(project.contractorProfitAmount ?? Math.round((project.totalAmount * (project.contractorProfitPercentage ?? 15)) / 100)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {project.hasMarkups !== false && (project.waterChargesPercentage ?? 1) > 0 && (
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>3. Water &amp; Sanitation Charges ({project.waterChargesPercentage ?? 1}%):</span>
                      <span className="text-blue-400 font-mono">
                        + ₹{(project.waterChargesAmount ?? Math.round((project.totalAmount * (project.waterChargesPercentage ?? 1)) / 100)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {project.hasMarkups !== false && (project.costIndexPercentage ?? 0) > 0 && (
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>4. Regional Cost Index Adjustment ({project.costIndexPercentage}%):</span>
                      <span className="text-orange-400 font-mono">
                        + ₹{(project.costIndexAmount ?? Math.round((project.totalAmount * (project.costIndexPercentage || 0)) / 100)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {project.hasMarkups !== false && (project.gstPercentage ?? 18) > 0 && (
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>5. Works Contract GST ({project.gstPercentage ?? 18}%):</span>
                      <span className="text-emerald-400 font-mono">
                        + ₹{(project.gstAmount ?? Math.round((project.totalAmount * (project.gstPercentage ?? 18)) / 100)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {project.hasMarkups !== false && (project.contingencyPercentage ?? 3) > 0 && (
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>6. Unforeseen Contingencies ({project.contingencyPercentage ?? 3}%):</span>
                      <span className="text-cyan-400 font-mono">
                        + ₹{(project.contingencyAmount ?? Math.round((project.totalAmount * (project.contingencyPercentage ?? 3)) / 100)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {project.hasMarkups !== false && (project.cessPercentage ?? 1) > 0 && (
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>7. Labour Welfare BOCW Cess ({project.cessPercentage ?? 1}%):</span>
                      <span className="text-purple-400 font-mono">
                        + ₹{(project.cessAmount ?? Math.round((project.totalAmount * (project.cessPercentage ?? 1)) / 100)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {project.hasMarkups === false && (
                    <div className="py-1 text-[11px] text-rose-300/90 font-mono flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Statutory markups &amp; taxes deleted from abstract.</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline font-bold text-white text-sm">
                    <span className="text-emerald-400 font-sans">
                      {project.includeMarkupsInGrandTotal !== false && project.hasMarkups !== false ? "Grand Estimated Total:" : "Direct Works Total:"}
                    </span>
                    <span className="text-emerald-300 text-base font-black">
                      ₹{project.grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-sans">
                    {project.hasMarkups !== false ? (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = deleteProjectMarkups(project);
                          onUpdateProject(updated);
                        }}
                        className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete All Markups</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = restoreCPWDMarkups(project);
                          onUpdateProject(updated);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Restore CPWD Markups</span>
                      </button>
                    )}
                    <span>{project.plinthAreaSqFt > 0 ? `₹${Math.round(project.grandTotal / project.plinthAreaSqFt)} / Sq.Ft` : ""}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: WORK ITEM MASTER LIBRARY & CPWD SCHEDULE OF RATES */}
          {/* ========================================================================= */}
          {activeDockTab === "library" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/95 border border-slate-800 rounded-2xl space-y-4 font-mono text-xs shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>CPWD Schedule of Rates</span>
                  </h4>
                  {onOpenItemsOfWorkMaster && (
                    <button
                      onClick={onOpenItemsOfWorkMaster}
                      className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Full Library</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Rate Type Selector Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveRateType("cpwd")}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[10px] transition-all cursor-pointer ${
                      activeRateType === "cpwd"
                        ? "bg-amber-600 text-slate-950 font-black shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    CPWD DSR Base
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRateType("kpwd")}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[10px] transition-all cursor-pointer ${
                      activeRateType === "kpwd"
                        ? "bg-emerald-600 text-slate-950 font-black shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Kerala PWD PRICE
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRateType("market")}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[10px] transition-all cursor-pointer ${
                      activeRateType === "market"
                        ? "bg-cyan-600 text-slate-950 font-black shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Market Rates
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ratesSearchQuery}
                    onChange={(e) => setRatesSearchQuery(e.target.value)}
                    placeholder="Search DSR items (e.g. excavation, RCC, vitrified)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  />
                  {ratesSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setRatesSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Chapter Filter Badges */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setSelectedChapterNo("all")}
                    className={`px-2.5 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition-all ${
                      selectedChapterNo === "all"
                        ? "bg-emerald-600 text-slate-950 font-black border-emerald-500"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    All Chapters ({CPWD_DSR_SCHEDULE_OF_RATES.length})
                  </button>
                  {Array.from(new Set(CPWD_DSR_SCHEDULE_OF_RATES.map((it) => it.chapterName))).map((chap) => {
                    const item = CPWD_DSR_SCHEDULE_OF_RATES.find((it) => it.chapterName === chap);
                    const chapNo = item?.chapterNo || 1;
                    return (
                      <button
                        key={chap}
                        type="button"
                        onClick={() => setSelectedChapterNo(chapNo)}
                        className={`px-2 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition-all ${
                          selectedChapterNo === chapNo
                            ? "bg-emerald-600 text-slate-950 font-black border-emerald-500"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {chap}
                      </button>
                    );
                  })}
                </div>

                {/* DSR Items List */}
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {CPWD_DSR_SCHEDULE_OF_RATES.filter((item) => {
                    if (selectedChapterNo !== "all" && item.chapterNo !== selectedChapterNo) return false;
                    if (ratesSearchQuery) {
                      const q = ratesSearchQuery.toLowerCase();
                      return (
                        item.particulars.toLowerCase().includes(q) ||
                        item.dsrCode.toLowerCase().includes(q) ||
                        item.category.toLowerCase().includes(q) ||
                        item.chapterName.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  }).map((item) => {
                    const activeRate =
                      activeRateType === "cpwd"
                        ? item.cpwdBaseRate
                        : activeRateType === "kpwd"
                        ? item.kpwdPriceRate
                        : item.marketRate;

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-500/60 transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[9px] font-bold">
                                {item.dsrCode}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans">{item.chapterName}</span>
                            </div>
                            <p className="text-xs text-slate-200 font-sans leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                              {item.particulars}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                          <div className="text-[11px] font-mono">
                            <span className="text-slate-400">Rate: </span>
                            <span className="text-emerald-400 font-bold">₹{activeRate.toLocaleString("en-IN")}</span>
                            <span className="text-slate-500"> / {item.unit}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Insert Main Item */}
                            <button
                              type="button"
                              onClick={() => {
                                const bIdx = selectedCellRange?.blockIdx ?? 0;
                                const aIdx = selectedCellRange?.appIdx ?? 0;
                                const blocks = [...(project.blocks || [])];
                                const targetBlock = { ...blocks[bIdx] };
                                const apps = [...targetBlock.appendices];
                                const targetApp = { ...apps[aIdx] };
                                const items = [...targetApp.items];

                                const dims = item.defaultDimensions || { nos: 1, length: 1, breadth: 1, depth: 1 };
                                const qty = Number((dims.nos * dims.length * dims.breadth * dims.depth).toFixed(4));
                                const newItem: EstimateItem = {
                                  id: `item_dsr_${Date.now()}_${item.id}`,
                                  slNo: String(items.filter((it) => !it.isSubItem).length + 1),
                                  particulars: item.particulars,
                                  nos: dims.nos,
                                  length: dims.length,
                                  breadth: dims.breadth,
                                  depth: dims.depth,
                                  quantity: qty,
                                  unit: item.unit,
                                  rate: activeRate,
                                  amount: Math.round(qty * activeRate),
                                  remarks: item.dsrCode,
                                  isSubItem: false
                                };

                                items.push(newItem);
                                targetApp.items = items;
                                apps[aIdx] = targetApp;
                                targetBlock.appendices = apps;
                                blocks[bIdx] = targetBlock;

                                onUpdateProject(normalizeProjectBlocks({ ...project, blocks }));
                              }}
                              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                              title="Insert single main item into active floor"
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Insert</span>
                            </button>

                            {/* If item has sub-items template */}
                            {item.subItemsTemplate && item.subItemsTemplate.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const bIdx = selectedCellRange?.blockIdx ?? 0;
                                  const aIdx = selectedCellRange?.appIdx ?? 0;
                                  const blocks = [...(project.blocks || [])];
                                  const targetBlock = { ...blocks[bIdx] };
                                  const apps = [...targetBlock.appendices];
                                  const targetApp = { ...apps[aIdx] };
                                  const items = [...targetApp.items];

                                  const mainSl = String(items.filter((it) => !it.isSubItem).length + 1);
                                  const subItemsSumQty = item.subItemsTemplate!.reduce(
                                    (acc, s) => acc + (s.nos * s.length * s.breadth * s.depth),
                                    0
                                  );

                                  const mainItem: EstimateItem = {
                                    id: `item_parent_${Date.now()}`,
                                    slNo: mainSl,
                                    particulars: item.particulars,
                                    nos: 1,
                                    length: 1,
                                    breadth: 1,
                                    depth: 1,
                                    quantity: Number(subItemsSumQty.toFixed(4)),
                                    unit: item.unit,
                                    rate: activeRate,
                                    amount: Math.round(subItemsSumQty * activeRate),
                                    remarks: item.dsrCode,
                                    isSubItem: false
                                  };
                                  items.push(mainItem);

                                  item.subItemsTemplate!.forEach((sub, subIdx) => {
                                    const subQty = Number((sub.nos * sub.length * sub.breadth * sub.depth).toFixed(4));
                                    items.push({
                                      id: `item_sub_${Date.now()}_${subIdx}`,
                                      slNo: `${mainSl}.${subIdx + 1}`,
                                      particulars: sub.particulars,
                                      nos: sub.nos,
                                      length: sub.length,
                                      breadth: sub.breadth,
                                      depth: sub.depth,
                                      quantity: subQty,
                                      unit: sub.unit || item.unit,
                                      rate: 0,
                                      amount: 0,
                                      remarks: sub.remarks || "",
                                      isSubItem: true
                                    });
                                  });

                                  targetApp.items = items;
                                  apps[aIdx] = targetApp;
                                  targetBlock.appendices = apps;
                                  blocks[bIdx] = targetBlock;

                                  onUpdateProject(normalizeProjectBlocks({ ...project, blocks }));
                                }}
                                className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/80 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                                title="Insert with complete sub-item measurements breakdown"
                              >
                                <CornerDownRight className="w-3 h-3 text-indigo-400" />
                                <span>+ Breakdown</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: AI QUANTITY SURVEYOR & SCANNER */}
          {/* ========================================================================= */}
          {activeDockTab === "ai" && (
            <div className="space-y-4">
              {/* Quick AI Presets Banner */}
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Quick AI Commands:</span>
                  {lastUndoState && (
                    <button
                      onClick={handleUndo}
                      className="text-amber-400 hover:text-amber-300 text-[10px] underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Undo AI Change</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Add 5% contingency",
                    "Add 18% GST",
                    "Calculate RCC slab for 1500 sq.ft",
                    "Update plastering rate to ₹280",
                    "Add electrical & plumbing lump sum"
                  ].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendCommand(preset)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-950 hover:border-indigo-600 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 hover:text-indigo-200 transition-colors text-left cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat History Messages */}
              <div className="space-y-3">
                {history.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] p-3 rounded-2xl text-xs space-y-1.5 leading-relaxed font-sans ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-none shadow-md"
                          : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 font-mono text-[9px] opacity-70">
                        <span className="font-bold flex items-center gap-1">
                          {msg.sender === "user" ? "YOU" : "VASTHUSILPY AI SURVEYOR"}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Attached images preview inside message */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex gap-2 flex-wrap pt-1">
                          {msg.attachments.map((att) => (
                            <img
                              key={att.id}
                              src={att.previewUrl}
                              alt={att.name}
                              onClick={() => setPreviewModalImg(att.previewUrl)}
                              className="w-16 h-16 object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-80 transition"
                            />
                          ))}
                        </div>
                      )}

                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* Audio Reader Control */}
                      {msg.sender === "ai" && isSpeechSynthesisSupported() && (
                        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                          <button
                            onClick={() => handleToggleSpeech(msg.id, msg.text)}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition cursor-pointer ${
                              activeSpeakingId === msg.id
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                                : "hover:text-slate-200 hover:bg-slate-800"
                            }`}
                            title="Listen to this explanation"
                          >
                            {activeSpeakingId === msg.id ? (
                              <>
                                <Square className="w-3 h-3 text-amber-400" />
                                <span>Stop Speech</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3 text-cyan-400" />
                                <span>Listen Audio</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="p-3 bg-slate-900 border border-indigo-700/50 rounded-2xl flex items-center gap-2 text-indigo-300 text-xs font-mono animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Gemini AI is analyzing plan &amp; computing PWD rates...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Tray */}
              {attachments.length > 0 && (
                <div className="p-2.5 bg-indigo-950/60 border border-indigo-800/40 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-indigo-300">
                    <span className="flex items-center gap-1 font-bold">
                      <Paperclip className="w-3 h-3" />
                      <span>Ready to Attach ({attachments.length}):</span>
                    </span>
                    <button
                      onClick={() => setAttachments([])}
                      className="text-slate-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="relative group shrink-0 w-20 bg-slate-900 border border-indigo-500/40 rounded-lg overflow-hidden"
                      >
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          className="h-12 w-full object-cover"
                        />
                        <div className="p-1 text-[8px] font-mono text-slate-300 truncate">
                          {att.name}
                        </div>
                        <button
                          onClick={() => removeAttachment(att.id)}
                          className="absolute top-1 right-1 p-0.5 bg-red-600 hover:bg-red-500 text-white rounded-full cursor-pointer shadow-md"
                          title="Remove"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Command Input Box */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  multiple
                  className="hidden"
                />

                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendCommand()}
                    placeholder={
                      isListening
                        ? "Listening... Speak your plan command"
                        : attachments.length > 0
                        ? "Plan attached! Type instructions (e.g. 'Create estimate')..."
                        : "Type live command or attach floor plan..."
                    }
                    disabled={loading}
                    className={`w-full bg-slate-950 border rounded-xl pl-3 pr-24 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans ${
                      isListening ? "border-red-500 ring-2 ring-red-500/30" : "border-slate-800 focus:border-indigo-500"
                    }`}
                  />

                  <div className="absolute right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        attachments.length > 0
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                      title="Attach Floor Plan / Drawing (Image/CAD)"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isListening ? "bg-red-600 text-white animate-pulse" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                      title="Voice command (Speech-to-Text)"
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendCommand()}
                      disabled={loading || (!input.trim() && attachments.length === 0)}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg transition-colors cursor-pointer"
                      title="Send Command"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 px-1">
                  <span>Gemini 3.7 Vision &amp; Plan Estimator</span>
                  <button
                    type="button"
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className="hover:underline cursor-pointer"
                  >
                    Auto-Audio: {autoSpeak ? "ON" : "OFF"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </aside>

      {/* Plan Preview Modal */}
      {previewModalImg && (
        <div
          onClick={() => setPreviewModalImg(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="font-mono text-xs text-slate-300 font-bold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Attached Plan &amp; Drawing Preview</span>
              </span>
              <button
                onClick={() => setPreviewModalImg(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center bg-black/50">
              <img
                src={previewModalImg}
                alt="Plan Preview"
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
