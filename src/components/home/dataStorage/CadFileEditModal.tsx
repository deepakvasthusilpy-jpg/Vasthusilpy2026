import React, { useState, useRef } from "react";
import {
  CADDrawingRecord,
  CADCategory,
  CADFileType,
  CADAttachment,
  CADFolder
} from "../../../types/dataStorageTypes";
import {
  saveCADDrawingRecord,
  getStoredCADFolders,
  formatBytes
} from "../../../utils/dataStorageManager";
import {
  X,
  Save,
  Upload,
  FileText,
  FileCode,
  Tag,
  Plus,
  Trash2,
  Paperclip,
  Check,
  Building,
  User,
  Phone,
  MapPin,
  Sparkles,
  Layers,
  FolderKanban,
  Star,
  Compass,
  Home,
  Folder,
  Ruler,
  AlertCircle
} from "lucide-react";

interface CadFileEditModalProps {
  file: CADDrawingRecord | null;
  defaultFolderId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedFile: CADDrawingRecord) => void;
  userEmail: string;
}

const CATEGORIES: { value: CADCategory; label: string; labelMl: string }[] = [
  { value: "ARCHITECTURAL_PLAN", label: "Architectural Plan (2D)", labelMl: "ആർക്കിടെക്ചറൽ പ്ലാൻ" },
  { value: "VASTU_THACHU_SHASTRA", label: "Vastu & Thachu Shastra", labelMl: "തച്ചുശാസ്ത്രം & വാസ്തു" },
  { value: "LSGD_KSMART_PERMIT", label: "Kerala LSGD / K-SMART Permit", labelMl: "കെ-സ്മാർട്ട് പെർമിറ്റ് ഡ്രോയിംഗ്സ്" },
  { value: "STRUCTURAL_DETAILS", label: "Structural & RCC Reinforcement", labelMl: "സ്ട്രക്ചറൽ & RCC ഡീറ്റൈൽസ്" },
  { value: "ELEVATION_3D", label: "3D Elevation & Interior Layout", labelMl: "3D എലിവേഷൻ & ഇന്റീരിയർ" },
  { value: "LAND_SURVEY_FMB", label: "Land Survey & FMB Sub-division", labelMl: "സർവ്വേ & FMB പ്ലോട്ട്" },
  { value: "MEP_ELECTRICAL_PLUMBING", label: "MEP, Electrical & Plumbing", labelMl: "ഇലക്ട്രിക്കൽ & പ്ലംബിംഗ്" },
  { value: "SITE_LAYOUT", label: "Site Plan & Service Layout", labelMl: "സൈറ്റ് പ്ലാൻ & സെറ്റ്ബാക്ക്" },
  { value: "ESTIMATE_BOQ", label: "Estimate, BOQ & Costing", labelMl: "എസ്റ്റിമേറ്റ് & BOQ" },
  { value: "GENERAL_OFFICE", label: "General Office Document", labelMl: "ഓഫീസ് ഡോക്യുമെന്റുകൾ" }
];

const FACING_OPTIONS = [
  "East (കിഴക്ക്)",
  "West (പടിഞ്ഞാറ്)",
  "North (വടക്ക്)",
  "South (തെക്ക്)",
  "North-East (ഈശാനകോൺ)",
  "North-West (വായുകോൺ)",
  "South-East (അഗ്നികോൺ)",
  "South-West (നിര്യതികോൺ)"
];

const BEDROOM_OPTIONS = [
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "4 BHK",
  "5+ BHK",
  "Commercial / Office (N/A)"
];

const FLOOR_OPTIONS = [
  "Single Floor (Ground Floor)",
  "G + 1 (2 Floors)",
  "G + 2 (3 Floors)",
  "G + 3 (4 Floors)",
  "Multi-Storey Tower"
];

const SUGGESTED_KEYWORDS = [
  "3bhk",
  "2bhk",
  "4bhk",
  "east entry",
  "north entry",
  "pooja room",
  "brahmasthanam",
  "vastu compliant",
  "keralassery",
  "palakkad",
  "ksmart",
  "lsgd permit",
  "kpbr 2019",
  "kpbr 2024",
  "column layout",
  "footing schedule",
  "dwg",
  "dxf",
  "pdf",
  "3d elevation"
];

export const CadFileEditModal: React.FC<CadFileEditModalProps> = ({
  file,
  defaultFolderId,
  isOpen,
  onClose,
  onSaved,
  userEmail
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folders = getStoredCADFolders();

  const [folderId, setFolderId] = useState<string>(
    file?.folderId || defaultFolderId || "folder-deepak"
  );
  const [name, setName] = useState(file?.name || "");
  const [title, setTitle] = useState(file?.title || "");
  const [projectCode, setProjectCode] = useState(file?.projectCode || "");
  const [projectName, setProjectName] = useState(file?.projectName || "");
  
  // Client & Architectural Details
  const [ownerName, setOwnerName] = useState(file?.ownerName || file?.clientName || "");
  const [mobileNo, setMobileNo] = useState(file?.mobileNo || file?.clientPhone || "");
  const [facing, setFacing] = useState(file?.facing || "East (കിഴക്ക്)");
  const [bedrooms, setBedrooms] = useState(file?.bedrooms || "3 BHK");
  const [floors, setFloors] = useState(file?.floors || "Single Floor (Ground Floor)");
  const [vasthuChuttu, setVasthuChuttu] = useState(file?.vasthuChuttu || "43 Kol 16 Viral (Dhana Porutham)");
  const [plotArea, setPlotArea] = useState(file?.plotArea || "5.0 Cents (2178 Sq.Ft)");
  const [builtUpArea, setBuiltUpArea] = useState(file?.builtUpArea || "1650 Sq.Ft (153.3 Sq.M)");
  const [location, setLocation] = useState(file?.location || "Keralassery, Palakkad");
  
  const [category, setCategory] = useState<CADCategory>(file?.category || "ARCHITECTURAL_PLAN");
  const [fileType, setFileType] = useState<CADFileType>(file?.fileType || "DWG");
  const [description, setDescription] = useState(file?.description || "");
  const [notes, setNotes] = useState(file?.notes || "");
  const [isStarred, setIsStarred] = useState(file?.isStarred || false);

  // Keywords Tag State
  const [keywords, setKeywords] = useState<string[]>(
    file?.keywords || ["vastu", "keralassery", "dwg", "3bhk"]
  );
  const [keywordInput, setKeywordInput] = useState("");

  // Attachments State
  const [attachments, setAttachments] = useState<CADAttachment[]>(file?.attachments || []);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleAddKeyword = (kw?: string) => {
    const target = (kw || keywordInput).trim().toLowerCase();
    if (!target) return;
    if (!keywords.includes(target)) {
      setKeywords([...keywords, target]);
    }
    setKeywordInput("");
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== kwToRemove));
  };

  // Handle Multi-File Upload with base64 conversion
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);

    Array.from(uploadedFiles).forEach((uploadedFile: File) => {
      const isDwg = uploadedFile.name.toLowerCase().endsWith(".dwg");
      const isDxf = uploadedFile.name.toLowerCase().endsWith(".dxf");
      const isPdf = uploadedFile.name.toLowerCase().endsWith(".pdf");
      const isImg = /\.(png|jpe?g|webp|svg)$/i.test(uploadedFile.name);
      const ext = uploadedFile.name.split(".").pop()?.toUpperCase() || "FILE";

      // Auto-populate name and title if empty
      if (!name) {
        setName(uploadedFile.name);
      }
      if (!title) {
        setTitle(uploadedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
      }

      if (isDwg) setFileType("DWG");
      else if (isDxf) setFileType("DXF");
      else if (isPdf) setFileType("PDF");
      else if (isImg) setFileType("IMAGE");

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAtt: CADAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: uploadedFile.name,
          type: uploadedFile.type || `application/${ext.toLowerCase()}`,
          size: uploadedFile.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
          isDwgOrDxf: isDwg || isDxf,
          isPdf,
          isImage: isImg
        };

        setAttachments((prev) => [...prev, newAtt]);
        setIsUploading(false);
      };

      reader.onerror = () => {
        setIsUploading(false);
      };

      reader.readAsDataURL(uploadedFile);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments(attachments.filter((a) => a.id !== attId));
  };

  // Form Submit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedFolder = folders.find((f) => f.id === folderId) || folders[0];
    const totalSize = attachments.reduce((sum, a) => sum + a.size, 0) || file?.fileSize || 1500000;

    // Build unique search keywords including owner, mobile, facing, bhk, floors, vasthu
    const autoKeywords = Array.from(
      new Set([
        ...keywords,
        ownerName.toLowerCase(),
        facing.toLowerCase(),
        bedrooms.toLowerCase(),
        floors.toLowerCase(),
        location.toLowerCase(),
        category.toLowerCase()
      ])
    ).filter(Boolean);

    const savedRecord: CADDrawingRecord = {
      id: file?.id || `CAD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`,
      name: name.trim() || "Untitled_Drawing.dwg",
      title: title.trim() || name.trim(),
      folderId: selectedFolder ? selectedFolder.id : "folder-deepak",
      folderPath: selectedFolder ? selectedFolder.path : "/DEEPAK",
      projectCode: projectCode.trim() || `PRJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 90) + 10}`,
      projectName: projectName.trim() || (ownerName ? `${ownerName} Residence` : "Vasthusilpy Architectural Project"),
      ownerName: ownerName.trim(),
      clientName: ownerName.trim(),
      mobileNo: mobileNo.trim(),
      clientPhone: mobileNo.trim(),
      facing,
      bedrooms,
      floors,
      vasthuChuttu: vasthuChuttu.trim(),
      plotArea: plotArea.trim(),
      builtUpArea: builtUpArea.trim(),
      location: location.trim(),
      category,
      fileType,
      fileSize: totalSize,
      keywords: autoKeywords,
      description: description.trim(),
      notes: notes.trim(),
      attachments,
      drawingData: file?.drawingData || {
        version: "1.0",
        units: "meters",
        scale: 1,
        layers: [
          { id: "layer-walls", name: "01_WALLS", color: "#10b981", visible: true, locked: false },
          { id: "layer-doors", name: "02_DOORS_WINDOWS", color: "#06b6d4", visible: true, locked: false },
          { id: "layer-dims", name: "03_DIMENSIONS", color: "#f59e0b", visible: true, locked: false },
          { id: "layer-vastu", name: "04_VASTU_MANDALA", color: "#ec4899", visible: true, locked: false },
          { id: "layer-text", name: "05_ANNOTATIONS", color: "#e2e8f0", visible: true, locked: false }
        ],
        entities: [
          { id: "w-1", type: "rect", layer: "layer-walls", x: 2, y: 2, width: 14, height: 11, strokeWidth: 3, color: "#10b981" },
          { id: "v-1", type: "vastu_grid", layer: "layer-vastu", x: 2, y: 2, width: 14, height: 11, color: "#ec4899" },
          { id: "t-1", type: "text", layer: "layer-text", x: 3.5, y: 4.5, text: `${projectName || "RESIDENCE"} PLAN`, fontSize: 15, color: "#38bdf8" }
        ]
      },
      shareSettings: file?.shareSettings || {
        isShared: true,
        shareToken: `vst-${Math.random().toString(36).substr(2, 9)}`,
        allowDownload: true,
        allowEdit: false
      },
      googleDriveSyncedAt: file?.googleDriveSyncedAt,
      createdAt: file?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: file?.createdBy || userEmail,
      version: (file?.version || 0) + 1,
      isStarred
    };

    saveCADDrawingRecord(savedRecord);
    onSaved(savedRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
              {file ? <FileCode className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-mono">
                {file ? "Edit Drawing Record & Metadata" : "Add / Upload New Drawing to Vault"}
              </h3>
              <p className="text-xs text-slate-400">
                Attach CAD (DWG/DXF), PDF & 3D Image drawings with comprehensive search specs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Folder & Primary Classification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div>
              <label className="block text-xs font-mono font-bold text-cyan-300 mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" />
                Target Vault Folder <span className="text-rose-400">*</span>
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.path} ({f.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CADCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.labelMl})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                Primary Format
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as CADFileType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-400 focus:outline-none focus:border-cyan-500 font-mono font-bold"
              >
                <option value="DWG">AutoCAD Drawing (.DWG)</option>
                <option value="DXF">Drawing Exchange Format (.DXF)</option>
                <option value="PDF">Architectural PDF (.PDF)</option>
                <option value="IMAGE">3D Render / Image (.PNG/.JPG)</option>
                <option value="CAD_VECTOR">2D Interactive Vector CAD</option>
                <option value="DOC">Project Documentation (.DOC)</option>
              </select>
            </div>
          </div>

          {/* File Names & Project Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                Drawing File Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Keralassery_3BHK_GroundFloor_Vastu.dwg"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                Drawing Title / Subject <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ground Floor 3BHK Architectural & Vastu Plan"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Owner, Mobile & Project Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Owner / Client Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => {
                  setOwnerName(e.target.value);
                  if (!projectName) setProjectName(`${e.target.value} Residence`);
                }}
                placeholder="e.g. Santhosh Kumar K."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Mobile Number
              </label>
              <input
                type="text"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="e.g. +91 9447123456"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-purple-400" />
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Santhosh Kumar Residence"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Architectural Specs: Facing, Bedrooms, Floors, Vasthu Chuttu */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
            <div className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              Architectural & Vasthu Specifications (Searchable)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Building Facing (ദിശ)
                </label>
                <select
                  value={facing}
                  onChange={(e) => setFacing(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {FACING_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Number of Bedrooms
                </label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {BEDROOM_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Number of Floors
                </label>
                <select
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-purple-300 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {FLOOR_OPTIONS.map((fl) => (
                    <option key={fl} value={fl}>
                      {fl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  വാസ്തു ചുറ്റ് (Vasthu Chuttu)
                </label>
                <input
                  type="text"
                  value={vasthuChuttu}
                  onChange={(e) => setVasthuChuttu(e.target.value)}
                  placeholder="e.g. 43 Kol 16 Viral (Dhana Porutham)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Plot Area (Cents / Sq.Ft)
                </label>
                <input
                  type="text"
                  value={plotArea}
                  onChange={(e) => setPlotArea(e.target.value)}
                  placeholder="e.g. 5.5 Cents / 2400 Sq.Ft"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Plinth / Built-up Area
                </label>
                <input
                  type="text"
                  value={builtUpArea}
                  onChange={(e) => setBuiltUpArea(e.target.value)}
                  placeholder="e.g. 1680 Sq.Ft (156 Sq.M)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Location & Project Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Project Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Keralassery, Palakkad"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                Project Code / Reference
              </label>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="e.g. PRJ-2026-042"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* File Attachments (PDF, DWG, DXF, Images) */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attached Files (PDF, DWG, DXF, Images, CAD)
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {attachments.length} file{attachments.length !== 1 ? "s" : ""} attached
              </span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-900/50 hover:bg-slate-900 group"
            >
              <Upload className="w-7 h-7 text-slate-400 group-hover:text-cyan-400 mx-auto mb-2 transition-colors" />
              <div className="text-xs font-bold text-slate-200 font-mono">
                Click to browse or drag & drop files here
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Supports AutoCAD (.dwg, .dxf), Drawings (.pdf), 3D Renders (.png, .jpg, .webp), and Docs
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".dwg,.dxf,.pdf,.png,.jpg,.jpeg,.webp,.svg,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {att.isPdf ? (
                        <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : att.isImage ? (
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-white font-bold truncate">{att.name}</div>
                        <div className="text-[10px] text-slate-400">{formatBytes(att.size)}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Keywords & Tags */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              Keywords & Quick Search Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="Type keyword and press Enter..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={() => handleAddKeyword()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Add Tag
              </button>
            </div>

            {/* Keyword Badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 text-[11px] font-mono"
                >
                  #{kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Suggested Tags */}
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] text-slate-500 self-center mr-1 font-mono">Suggested:</span>
              {SUGGESTED_KEYWORDS.filter((k) => !keywords.includes(k)).slice(0, 8).map((sk) => (
                <button
                  type="button"
                  key={sk}
                  onClick={() => handleAddKeyword(sk)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
                >
                  +{sk}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Engineering Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                Description / Scope
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of the architectural drawing, room dimensions, Vastu specifications..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                Internal Engineering Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Submission status, Auto-DCR scrutiny, site survey references..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Starred Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isStarred"
              checked={isStarred}
              onChange={(e) => setIsStarred(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <label
              htmlFor="isStarred"
              className="text-xs font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              Mark as Starred / Priority Project
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{file ? "Update Drawing" : "Save to Vault"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
