import React, { useState, useEffect, useRef } from "react";
import {
  SiteInspection,
  InspectionTemplate,
  InspectionQuestion,
  InspectionAnswer,
  InspectionMedia,
  InspectionGPS
} from "../../types/siteInspection";
import {
  loadInspectionTemplates,
  saveSiteInspections,
  loadSiteInspections,
  fetchCurrentGPSLocation,
  generateInspectionNumber,
  sendWhatsAppNotification,
  downloadInspectionPdf,
  DEFAULT_INSPECTION_EMAIL,
  DEFAULT_INSPECTION_WHATSAPP
} from "../../utils/siteInspectionManager";
import { triggerAppNotification } from "../../context/NotificationContext";
import {
  MapPin,
  Camera,
  Video,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Send,
  Download,
  Share2,
  Trash2,
  RotateCw,
  Eye,
  Check,
  X,
  FileText,
  User,
  Phone,
  Building,
  Layers,
  Sparkles,
  ShieldCheck,
  Compass,
  Clock,
  HelpCircle,
  Plus
} from "lucide-react";

interface MobileInspectionFormProps {
  onInspectionSubmitted?: (inspection: SiteInspection) => void;
  onOpenDashboard?: () => void;
}

export const MobileInspectionForm: React.FC<MobileInspectionFormProps> = ({
  onInspectionSubmitted,
  onOpenDashboard
}) => {
  const templates = loadInspectionTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || "tpl_standard_site");

  // Core Form Fields
  const [ownerName, setOwnerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [place, setPlace] = useState("");
  const [panchayathMunicipality, setPanchayathMunicipality] = useState("");
  const [surveyNumber, setSurveyNumber] = useState("");
  const [inspectorName, setInspectorName] = useState("Deepak / Field Staff");
  const [inspectorPhone, setInspectorPhone] = useState("+918848241463");
  const [overallRemarks, setOverallRemarks] = useState("");

  // Read-only Date & Time (auto-generated upon opening)
  const [dateTime] = useState<string>(() => new Date().toISOString());

  // GPS Location State
  const [gps, setGps] = useState<InspectionGPS | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [gpsError, setGpsError] = useState("");

  // Media (Photos & Videos)
  const [mediaList, setMediaList] = useState<InspectionMedia[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Dynamic Question Answers
  const [answers, setAnswers] = useState<Record<string, { answer: string | boolean | number; notes?: string }>>({});

  // Dynamic Custom Question Added On-the-fly in Field
  const [customQuestions, setCustomQuestions] = useState<InspectionQuestion[]>([]);
  const [showAddCustomQuestion, setShowAddCustomQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<"yes_no" | "descriptive">("yes_no");

  // Form Submission & Success State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedInspection, setSubmittedInspection] = useState<SiteInspection | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const allQuestions = [...(activeTemplate?.questions || []), ...customQuestions];

  // Initialize default answers when template changes
  useEffect(() => {
    const initialAnswers: Record<string, { answer: string | boolean | number; notes?: string }> = {};
    allQuestions.forEach((q) => {
      if (answers[q.id] !== undefined) {
        initialAnswers[q.id] = answers[q.id];
      } else if (q.type === "yes_no") {
        initialAnswers[q.id] = { answer: true };
      } else if (q.type === "select" && q.options && q.options.length > 0) {
        initialAnswers[q.id] = { answer: q.options[0] };
      } else {
        initialAnswers[q.id] = { answer: "" };
      }
    });
    setAnswers(initialAnswers);
  }, [selectedTemplateId]);

  // Handle GPS Fetch
  const handleFetchGPS = async () => {
    setIsFetchingGps(true);
    setGpsError("");
    try {
      const locationData = await fetchCurrentGPSLocation();
      setGps(locationData);
      triggerAppNotification("📍 GPS Coordinates captured accurately!", "success");
    } catch (err: any) {
      setGpsError(err.message || "Failed to fetch GPS coordinates.");
      triggerAppNotification(err.message || "GPS fetch failed.", "error");
    } finally {
      setIsFetchingGps(false);
    }
  };

  // Compress image to Base64 for rapid offline/online storage
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;

          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Handle Photo & Video File Inputs
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: "photo" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    try {
      const newItems: InspectionMedia[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (mediaType === "photo") {
          const compressedDataUrl = await compressImage(file);
          newItems.push({
            id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            type: "photo",
            url: compressedDataUrl,
            name: file.name,
            size: file.size,
            caption: `Photo taken at ${new Date().toLocaleTimeString()}`,
            timestamp: new Date().toISOString()
          });
        } else {
          // For video, preview object URL or data
          const videoUrl = URL.createObjectURL(file);
          newItems.push({
            id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            type: "video",
            url: videoUrl,
            name: file.name,
            size: file.size,
            caption: `Video recorded at ${new Date().toLocaleTimeString()}`,
            timestamp: new Date().toISOString()
          });
        }
      }

      setMediaList((prev) => [...prev, ...newItems]);
      triggerAppNotification(`Added ${newItems.length} media file(s)`, "success");
    } catch (err) {
      triggerAppNotification("Failed to process media files.", "error");
    } finally {
      setIsUploadingMedia(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveMedia = (id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAnswerChange = (questionId: string, value: string | boolean | number, notes?: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        answer: value,
        notes: notes !== undefined ? notes : prev[questionId]?.notes
      }
    }));
  };

  const handleAddCustomQuestion = () => {
    if (!newQuestionText.trim()) return;
    const newQ: InspectionQuestion = {
      id: `custom_q_${Date.now()}`,
      question: newQuestionText.trim(),
      type: newQuestionType,
      category: "custom"
    };

    setCustomQuestions((prev) => [...prev, newQ]);
    setAnswers((prev) => ({
      ...prev,
      [newQ.id]: { answer: newQuestionType === "yes_no" ? true : "" }
    }));
    setNewQuestionText("");
    setShowAddCustomQuestion(false);
    triggerAppNotification("Custom question added to inspection checklist", "success");
  };

  // Validate & Submit Form
  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!ownerName.trim()) {
      newErrors.ownerName = "Please enter Owner / Client name";
    }

    const cleanPhone = mobileNumber.trim().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.mobileNumber = "Please enter valid 10-digit mobile number";
    }

    if (!place.trim()) {
      newErrors.place = "Please enter Site Location / Place";
    }

    // Required questions check
    allQuestions.forEach((q) => {
      if (q.required) {
        const val = answers[q.id]?.answer;
        if (val === undefined || val === "" || (q.type === "descriptive" && String(val).trim() === "")) {
          newErrors[q.id] = `"${q.question}" is required`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      triggerAppNotification("Please fill in all required fields before submitting.", "error");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedAnswers: InspectionAnswer[] = allQuestions.map((q) => ({
        questionId: q.id,
        questionText: q.question,
        answer: answers[q.id]?.answer ?? (q.type === "yes_no" ? false : ""),
        notes: answers[q.id]?.notes
      }));

      const newInspection: SiteInspection = {
        id: `insp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        inspectionNumber: generateInspectionNumber(),
        templateId: selectedTemplateId,
        templateName: activeTemplate?.name || "General Site Inspection",
        ownerName: ownerName.trim(),
        mobileNumber: mobileNumber.trim(),
        place: place.trim(),
        panchayathMunicipality: panchayathMunicipality.trim() || undefined,
        surveyNumber: surveyNumber.trim() || undefined,
        inspectorName: inspectorName.trim() || "Vasthusilpy Field Staff",
        inspectorPhone: inspectorPhone.trim() || undefined,
        dateTime,
        submittedAt: new Date().toISOString(),
        gps: gps || undefined,
        answers: formattedAnswers,
        media: mediaList,
        overallRemarks: overallRemarks.trim() || undefined,
        status: "submitted",
        emailSentTo: DEFAULT_INSPECTION_EMAIL,
        whatsAppNotifiedTo: DEFAULT_INSPECTION_WHATSAPP,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage & sync to Firestore
      const existing = loadSiteInspections();
      saveSiteInspections([newInspection, ...existing]);

      setSubmittedInspection(newInspection);
      if (onInspectionSubmitted) {
        onInspectionSubmitted(newInspection);
      }

      triggerAppNotification(`🎉 Site Inspection ${newInspection.inspectionNumber} submitted successfully!`, "success");
    } catch (err: any) {
      triggerAppNotification("Failed to submit site inspection: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedInspection(null);
    setOwnerName("");
    setMobileNumber("");
    setPlace("");
    setPanchayathMunicipality("");
    setSurveyNumber("");
    setOverallRemarks("");
    setGps(null);
    setMediaList([]);
    setCustomQuestions([]);
    setErrors({});
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24">
      {/* SUCCESS CONFIRMATION SCREEN */}
      {submittedInspection ? (
        <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Inspection Submitted!</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Ref Number: <strong className="text-emerald-400 font-mono">{submittedInspection.inspectionNumber}</strong>
            </p>
            <p className="text-xs text-slate-400">
              Data, GPS coordinates, and media files have been securely saved and synced.
            </p>
          </div>

          {/* Automated Action Triggers */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Automated Triggers & Sharing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* WhatsApp Trigger */}
              <button
                type="button"
                onClick={() => sendWhatsAppNotification(submittedInspection)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Send WhatsApp to +91 8848241463</span>
              </button>

              {/* Download A4 PDF */}
              <button
                type="button"
                onClick={() => downloadInspectionPdf(submittedInspection)}
                className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download A4 PDF Report</span>
              </button>
            </div>

            {/* Email Notification Status */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Email Summary Queued:</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-[11px]">
                {DEFAULT_INSPECTION_EMAIL}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handleResetForm}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>New Site Inspection</span>
            </button>

            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Layers className="w-4 h-4" />
                <span>View in Admin Dashboard</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* MAIN MOBILE DATA ENTRY FORM */
        <form onSubmit={handleSubmitInspection} className="space-y-4">
          {/* Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Smartphone className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                    Mobile Site Inspection
                  </h1>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Touch-friendly field report with GPS & Media
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                  FIELD STAFF
                </span>
              </div>
            </div>
          </div>

          {/* 1. INSPECTION TEMPLATE SELECTOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Inspection Template / Checklist Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    selectedTemplateId === tpl.id
                      ? "bg-emerald-500/20 border-emerald-400 text-white font-bold ring-1 ring-emerald-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <p className="text-xs font-semibold">{tpl.name}</p>
                  {tpl.nameMl && <p className="text-[10px] text-emerald-400/80 font-mono mt-0.5">{tpl.nameMl}</p>}
                </button>
              ))}
            </div>
          </div>

          {/* 2. CORE INFORMATION (Owner, Phone, Location, Read-Only Date) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xl">
            <h2 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Client & Site Details
            </h2>

            {/* Read-Only Date & Time */}
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Date & Time (System Generated):
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                {new Date(dateTime).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>

            {/* Owner Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Owner / Client Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => {
                  setOwnerName(e.target.value);
                  if (errors.ownerName) setErrors((prev) => ({ ...prev, ownerName: "" }));
                }}
                placeholder="e.g. Adv. K. R. Nambiar / Smt. Lakshmi"
                className={`w-full bg-slate-950 border ${
                  errors.ownerName ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-700"
                } rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400`}
              />
              {errors.ownerName && <p className="text-[11px] text-rose-400">{errors.ownerName}</p>}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Mobile Number <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: "" }));
                  }}
                  placeholder="e.g. 9847012345 or +91 9847012345"
                  className={`w-full bg-slate-950 border ${
                    errors.mobileNumber ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-700"
                  } rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono`}
                />
              </div>
              {errors.mobileNumber && <p className="text-[11px] text-rose-400">{errors.mobileNumber}</p>}
            </div>

            {/* Place / Site Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Place / Locality <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={place}
                  onChange={(e) => {
                    setPlace(e.target.value);
                    if (errors.place) setErrors((prev) => ({ ...prev, place: "" }));
                  }}
                  placeholder="e.g. Aluva, Near Metro Station"
                  className={`w-full bg-slate-950 border ${
                    errors.place ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-700"
                  } rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400`}
                />
                {errors.place && <p className="text-[11px] text-rose-400">{errors.place}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Panchayath / Municipality
                </label>
                <input
                  type="text"
                  value={panchayathMunicipality}
                  onChange={(e) => setPanchayathMunicipality(e.target.value)}
                  placeholder="e.g. Choornikkara Panchayath"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Survey Number & Inspector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Survey Number / Resurvey
                </label>
                <input
                  type="text"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  placeholder="e.g. Sy No. 412/3-A"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Inspecting Officer / Staff
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="Inspector Name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* 3. GPS GEOLOCATION CAPTURE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Live GPS Geolocation
              </h2>
              {gps && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  LOCKED
                </span>
              )}
            </div>

            {gps ? (
              <div className="p-3.5 bg-slate-950 border border-cyan-500/40 rounded-2xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-cyan-300 font-mono">
                      📍 Lat: {gps.latitude.toFixed(6)}, Lng: {gps.longitude.toFixed(6)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      GPS Accuracy: <strong className="text-emerald-400">±{gps.accuracy || 0}m</strong>
                      {gps.altitude && ` • Alt: ${gps.altitude}m`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchGPS}
                    disabled={isFetchingGps}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Refresh GPS location"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isFetchingGps ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <a
                    href={gps.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1"
                  >
                    <span>Open in Google Maps</span>
                  </a>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Captured {new Date(gps.fetchedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 border border-dashed border-slate-750 rounded-2xl text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Tap the button below to fetch exact GPS coordinates of the site using your smartphone GPS.
                </p>
                <button
                  type="button"
                  onClick={handleFetchGPS}
                  disabled={isFetchingGps}
                  className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 active:scale-98 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition cursor-pointer"
                >
                  <MapPin className={`w-4 h-4 ${isFetchingGps ? "animate-bounce" : ""}`} />
                  <span>{isFetchingGps ? "Fetching GPS Location..." : "📍 Fetch Live Location"}</span>
                </button>
                {gpsError && <p className="text-xs text-rose-400">{gpsError}</p>}
              </div>
            )}
          </div>

          {/* 4. MEDIA UPLOAD (PHOTOS & VIDEOS - CAMERA TRIGGER) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                Site Media (Photos & Videos)
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {mediaList.length} attached
              </span>
            </div>

            {/* Hidden Inputs for Camera / Gallery */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={(e) => handleMediaUpload(e, "photo")}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              onChange={(e) => handleMediaUpload(e, "video")}
              className="hidden"
            />

            {/* Camera / Upload Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="py-3 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                <Camera className="w-4 h-4" />
                <span>📷 Capture Photo</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="py-3 px-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                <Video className="w-4 h-4" />
                <span>🎥 Record Video</span>
              </button>
            </div>

            {/* Media Preview Grid */}
            {mediaList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {mediaList.map((item) => (
                  <div
                    key={item.id}
                    className="relative group bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md"
                  >
                    {item.type === "photo" ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-28 object-cover rounded-t-xl"
                      />
                    ) : (
                      <div className="w-full h-28 bg-slate-900 flex flex-col items-center justify-center text-indigo-400 p-2 text-center">
                        <Video className="w-8 h-8 mb-1" />
                        <span className="text-[10px] truncate max-w-full font-mono">{item.name}</span>
                      </div>
                    )}

                    <div className="p-1.5 bg-slate-950 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 truncate max-w-[80%] font-mono">
                        {item.type === "photo" ? "Photo" : "Video"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(item.id)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="Delete media"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. DYNAMIC QUESTION CHECKLIST */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h2 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Inspection Checklist & Observations
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Answer the verification questions below
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCustomQuestion(!showAddCustomQuestion)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Question</span>
              </button>
            </div>

            {/* Custom Question Inline Builder */}
            {showAddCustomQuestion && (
              <div className="p-3 bg-slate-950 border border-emerald-500/40 rounded-2xl space-y-2.5">
                <span className="text-xs font-bold text-white">Add Custom Question in the Field</span>
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Enter observation question (e.g. Distance from well?)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewQuestionType("yes_no")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        newQuestionType === "yes_no"
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "bg-slate-850 text-slate-400"
                      }`}
                    >
                      Yes/No Toggle
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewQuestionType("descriptive")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        newQuestionType === "descriptive"
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "bg-slate-850 text-slate-400"
                      }`}
                    >
                      Descriptive Text
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomQuestion}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-3.5">
              {allQuestions.map((q, idx) => {
                const currentAns = answers[q.id]?.answer;
                const currentNotes = answers[q.id]?.notes || "";

                return (
                  <div
                    key={q.id}
                    className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl space-y-2.5"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-200">
                          <span className="text-emerald-400 mr-1.5">{idx + 1}.</span>
                          {q.question} {q.required && <span className="text-rose-400">*</span>}
                        </p>
                        {q.questionMl && (
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{q.questionMl}</p>
                        )}
                        {q.helpText && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5">{q.helpText}</p>
                        )}
                      </div>
                    </div>

                    {/* Question Inputs by Type */}
                    {q.type === "yes_no" && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAnswerChange(q.id, true)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            currentAns === true
                              ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>YES</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAnswerChange(q.id, false)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            currentAns === false
                              ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <X className="w-4 h-4 stroke-[3]" />
                          <span>NO</span>
                        </button>
                      </div>
                    )}

                    {q.type === "select" && q.options && (
                      <select
                        value={String(currentAns || "")}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                      >
                        {q.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {q.type === "descriptive" && (
                      <textarea
                        rows={2}
                        value={String(currentAns || "")}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Type observation findings / remarks here..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      />
                    )}

                    {/* Optional Note Field for Any Question */}
                    {q.type === "yes_no" && (
                      <input
                        type="text"
                        value={currentNotes}
                        onChange={(e) => handleAnswerChange(q.id, currentAns ?? true, e.target.value)}
                        placeholder="Optional remarks (e.g., 3.5m clearance)"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. OVERALL REMARKS & SUBMIT BUTTON */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Final Summary Remarks / Recommendations
              </label>
              <textarea
                rows={3}
                value={overallRemarks}
                onChange={(e) => setOverallRemarks(e.target.value)}
                placeholder="e.g. Site is suitable for G+1 residential building. Setbacks verified. Ready for architectural plan drafting."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Big Touch-Friendly Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition cursor-pointer active:scale-98"
            >
              <Send className="w-5 h-5 stroke-[2.5]" />
              <span>{isSubmitting ? "Submitting & Generating Report..." : "SUBMIT SITE INSPECTION"}</span>
            </button>

            <p className="text-[10px] text-center text-slate-500 font-mono">
              Auto-saves to database, prepares A4 PDF report, and triggers WhatsApp / Email summary.
            </p>
          </div>
        </form>
      )}
    </div>
  );
};
