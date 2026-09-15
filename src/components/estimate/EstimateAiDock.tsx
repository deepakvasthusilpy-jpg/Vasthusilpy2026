import React, { useState, useRef, useEffect } from "react";
import { EstimateProject, normalizeProjectBlocks } from "../../data/estimateData";
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
  Check
} from "lucide-react";
import {
  speakText,
  stopSpeech,
  isSpeechSynthesisSupported,
  isSpeaking as checkIsSpeaking
} from "../../utils/audioSpeechHelper";

interface EstimateAiDockProps {
  project: EstimateProject;
  onUpdateProject: (updated: EstimateProject) => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

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

export const EstimateAiDock: React.FC<EstimateAiDockProps> = ({
  project,
  onUpdateProject,
  isOpen,
  onToggle,
  className = ""
}) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastUndoState, setLastUndoState] = useState<EstimateProject | null>(null);
  const [lastSuccessMsg, setLastSuccessMsg] = useState<string | null>(null);

  // Attachments State
  const [attachments, setAttachments] = useState<PlanAttachment[]>([]);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // Audio Output / Speech Synthesis State
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

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
      speakText(text, {
        onStart: () => setActiveSpeakingId(msgId),
        onEnd: () => setActiveSpeakingId(null),
        onError: () => setActiveSpeakingId(null)
      });
    }
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 25 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 25MB limit.`);
        setTimeout(() => setError(null), 4000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newAttachment: PlanAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type: file.type || "image/jpeg",
          size: file.size,
          data: base64,
          previewUrl: base64
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSendCommand = async (commandText?: string) => {
    const query = commandText !== undefined ? commandText : input;
    if ((!query.trim() && attachments.length === 0) || loading) return;

    setError(null);
    const sentAttachments = [...attachments];

    const userMsg: CommandHistoryItem = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: query || (sentAttachments.length > 0 ? "Attached plan / area drawing for estimation." : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments: sentAttachments.length > 0 ? sentAttachments : undefined
    };

    setHistory((prev) => [...prev, userMsg]);
    if (commandText === undefined) setInput("");
    setAttachments([]); // Clear current tray
    setLoading(true);

    // Save undo state before modifying
    const previousSnapshot = JSON.parse(JSON.stringify(project));
    setLastUndoState(previousSnapshot);

    try {
      const res = await fetch("/api/estimate/ai-modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query || "Create / modify estimate based on attached architectural plan and area details.",
          currentProject: project,
          attachments: sentAttachments.map((a) => ({
            name: a.name,
            mimeType: a.type,
            data: a.data
          })),
          history: history.slice(-6).map((h) => ({
            role: h.sender === "user" ? "user" : "model",
            text: h.text
          }))
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to process estimate command with AI.");
      }

      if (data.project) {
        // Normalize and apply updated project
        const normalized = normalizeProjectBlocks(data.project);
        onUpdateProject(normalized);
        setLastSuccessMsg(
          sentAttachments.length > 0
            ? `Estimate generated from plan (${normalized.plinthAreaSqFt || 0} sq.ft)!`
            : "Estimate modified live in sheet!"
        );
        setTimeout(() => setLastSuccessMsg(null), 5000);
      }

      const explanationText =
        data.explanation || "എസ്റ്റിമേറ്റ് വിജയകരമായി തയ്യാറാക്കി / പരിഷ്കരിച്ചു (Estimate updated successfully).";

      const aiMsgId = `ai_${Date.now()}`;
      const aiMsg: CommandHistoryItem = {
        id: aiMsgId,
        sender: "ai",
        text: explanationText,
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionType: data.actionType,
        previousProjectState: previousSnapshot
      };

      setHistory((prev) => [...prev, aiMsg]);

      // Auto Audio readout if enabled
      if (autoSpeak) {
        speakText(explanationText, {
          onStart: () => setActiveSpeakingId(aiMsgId),
          onEnd: () => setActiveSpeakingId(null),
          onError: () => setActiveSpeakingId(null)
        });
      }
    } catch (err: any) {
      console.error("AI Dock error:", err);
      setError(err.message || "Could not reach AI server. Please check your connection.");
      const errorMsg: CommandHistoryItem = {
        id: `err_${Date.now()}`,
        sender: "ai",
        text: `⚠️ ${err.message || "Failed to execute command. Please try again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setHistory((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (lastUndoState) {
      onUpdateProject(lastUndoState);
      setLastUndoState(null);
      setLastSuccessMsg("Reverted back to previous estimate state.");
      setTimeout(() => setLastSuccessMsg(null), 4000);

      const undoNotice: CommandHistoryItem = {
        id: `undo_${Date.now()}`,
        sender: "ai",
        text: "↩️ Previous estimate state successfully restored.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setHistory((prev) => [...prev, undoNotice]);
    }
  };

  const PLAN_QUICK_COMMANDS = [
    {
      label: "📐 Estimate from Attached Plan",
      prompt: "Extract room dimensions and generate a complete Kerala PWD Estimate for all structural stages from the attached plan."
    },
    {
      label: "🏗️ Calc RCC & Slab Area",
      prompt: "Calculate RCC 1:1.5:3 roof slab (12cm), beams, columns, and Fe500D steel quantities from the attached floor plan."
    },
    {
      label: "+ 5% Contingency",
      prompt: "Add 5% Unforeseen Expenses & Contingencies to this estimate and recalculate grand total."
    },
    {
      label: "Update RCC Rate",
      prompt: "Update RCC 1:1.5:3 concrete rate across all floors to ₹19,500 per cum."
    },
    {
      label: "+ First Floor Block",
      prompt: "Add a complete First Floor appendix with slab, brickwork, plastering, and doors/windows."
    },
    {
      label: "Add Plastering 12mm",
      prompt: "Add interior and exterior cement plastering 1:4 (12mm) @ ₹380/sqm."
    }
  ];

  if (!isOpen) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 print:hidden">
        <button
          onClick={onToggle}
          className="bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-mono font-bold text-xs py-3.5 px-3 rounded-l-2xl shadow-2xl flex items-center gap-2 border-y border-l border-indigo-400/40 cursor-pointer transition-all hover:pr-4 group"
          title="Open Estimate AI Side Dock"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Bot className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span className="[writing-mode:vertical-lr] tracking-widest text-[11px] uppercase font-mono">
            ESTIMATE AI & PLAN
          </span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <aside
        className={`fixed top-16 right-0 bottom-0 w-80 sm:w-96 lg:w-[440px] bg-slate-950/95 backdrop-blur-xl border-l border-indigo-900/60 shadow-2xl flex flex-col z-40 print:hidden transition-all duration-300 ${className}`}
        aria-label="Estimate AI Side Dock"
      >
        {/* Dock Header */}
        <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-indigo-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-xs text-white font-sans uppercase tracking-wide flex items-center gap-1">
                  <span>ESTIMATE AI & PLAN DOCK</span>
                </h3>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700/80 px-1.5 py-0.2 rounded font-mono font-bold">
                  MULTIMODAL
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                Plan Vision & Live Audio Quantity Surveyor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Auto Voice Toggle */}
            <button
              onClick={() => {
                const next = !autoSpeak;
                setAutoSpeak(next);
                if (!next) stopSpeech();
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                autoSpeak
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800"
              }`}
              title={autoSpeak ? "Auto Voice Readout: ON" : "Auto Voice Readout: OFF"}
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {lastUndoState && (
              <button
                onClick={handleUndo}
                className="p-1.5 text-amber-300 hover:bg-amber-950/60 rounded-lg border border-amber-600/40 transition-colors cursor-pointer"
                title="Undo Last AI Modification"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onToggle}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Collapse AI Dock"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Project Banner */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-300 truncate">
            <Layers className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="text-white font-bold truncate">{project.id}:</span>
            <span className="text-slate-400 truncate">{project.clientName}</span>
          </div>
          <div className="text-right shrink-0 text-emerald-400 font-bold">
            ₹{project.grandTotal.toLocaleString("en-IN")}
          </div>
        </div>

        {/* Success Notification Banner */}
        {lastSuccessMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-4 py-2 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lastSuccessMsg}</span>
            </div>
            {lastUndoState && (
              <button
                onClick={handleUndo}
                className="text-[10px] underline hover:text-white font-mono cursor-pointer ml-2"
              >
                Undo
              </button>
            )}
          </div>
        )}

        {/* Quick Actions Scrollable Chips */}
        <div className="p-2.5 bg-slate-950/80 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span>PLAN & ESTIMATE SHORTCUTS</span>
            </span>
            <span className="text-[9px] font-mono text-slate-500">Click to apply</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {PLAN_QUICK_COMMANDS.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSendCommand(cmd.prompt)}
                disabled={loading}
                className="bg-slate-900 hover:bg-indigo-950 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-700/80 text-[10px] font-mono px-2 py-1 rounded-lg transition-all text-left flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span>{cmd.label}</span>
                <ArrowUpRight className="w-2.5 h-2.5 text-slate-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Chat / Conversation Messages */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans text-xs">
          {history.map((item) => {
            const isItemSpeaking = activeSpeakingId === item.id;

            return (
              <div
                key={item.id}
                className={`flex flex-col ${item.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[92%] leading-relaxed whitespace-pre-wrap relative group ${
                    item.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-md text-xs font-sans"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none font-sans text-xs shadow-md"
                  }`}
                >
                  {/* Attached Images in User Message */}
                  {item.attachments && item.attachments.length > 0 && (
                    <div className="mb-2 space-y-1.5">
                      <div className="text-[10px] font-mono text-indigo-200 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        <span>Attached Plan ({item.attachments.length} file{item.attachments.length > 1 ? "s" : ""}):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.attachments.map((att) => (
                          <div
                            key={att.id}
                            onClick={() => setPreviewModalImg(att.previewUrl)}
                            className="relative group/att cursor-pointer rounded-lg overflow-hidden border border-indigo-400/40 bg-indigo-950/60 max-w-[140px]"
                          >
                            <img
                              src={att.previewUrl}
                              alt={att.name}
                              className="h-16 w-full object-cover group-hover/att:scale-105 transition-transform"
                            />
                            <div className="p-1 bg-slate-950/90 text-[9px] font-mono truncate text-slate-300">
                              {att.name}
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Main Text Content */}
                  <div>{item.text}</div>

                  {/* AI Audio Speech Control Header/Footer */}
                  {item.sender === "ai" && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <button
                        onClick={() => handleToggleSpeech(item.id, item.text)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all cursor-pointer ${
                          isItemSpeaking
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white"
                        }`}
                        title={isItemSpeaking ? "Stop Voice Narration" : "Listen to Estimate Summary"}
                      >
                        {isItemSpeaking ? (
                          <>
                            <Square className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>Stop Audio</span>
                            <span className="flex items-center gap-0.5 ml-1">
                              <span className="w-1 h-3 bg-amber-400 animate-pulse" />
                              <span className="w-1 h-2 bg-amber-400 animate-pulse delay-75" />
                              <span className="w-1 h-3.5 bg-amber-400 animate-pulse delay-150" />
                            </span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-indigo-400" />
                            <span>Listen (Audio)</span>
                          </>
                        )}
                      </button>

                      <span className="text-[9px] text-slate-500 font-mono">
                        {item.timestamp}
                      </span>
                    </div>
                  )}
                </div>

                {item.sender === "user" && (
                  <span className="text-[9px] text-slate-500 font-mono mt-0.5 px-1">
                    {item.timestamp}
                  </span>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-indigo-950/50 border border-indigo-800/60 rounded-2xl text-indigo-300 font-mono text-xs animate-pulse">
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>AI Analyzing plan drawing & calculating quantities...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-2xl text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Tray before sending */}
        {attachments.length > 0 && (
          <div className="p-2.5 bg-indigo-950/60 border-t border-indigo-800/40">
            <div className="flex items-center justify-between text-[10px] font-mono text-indigo-300 mb-1.5">
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
                    className="absolute top-1 right-1 p-0.5 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors cursor-pointer shadow-md"
                    title="Remove attachment"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Command Input Area */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
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
              {/* Attach Plan Button */}
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

              {/* Voice Microphone Input */}
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

              {/* Send Command */}
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
            <span className="flex items-center gap-1">
              <span>Gemini 3.7 Vision & TTS</span>
            </span>
            <span className="flex items-center gap-1">
              <span>Auto-Audio: {autoSpeak ? "ON" : "OFF"}</span>
            </span>
          </div>
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
                <span>Attached Plan & Drawing Preview</span>
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
