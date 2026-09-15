import React, { useState, useRef } from "react";
import {
  ApplicationFormTemplate,
  FormFieldDefinition
} from "../../types";
import {
  UploadCloud,
  Plus,
  Trash2,
  Edit2,
  Save,
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  Move,
  Layers,
  ArrowLeft,
  X,
  Languages,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface FormPdfBuilderViewProps {
  initialForm?: ApplicationFormTemplate | null;
  onSaveForm: (form: ApplicationFormTemplate) => void;
  onCancel: () => void;
}

// Preset Kerala Government & Civil Application Form Fields
const QUICK_PRESET_FIELDS: Array<{
  labelMl: string;
  labelEn: string;
  key: string;
  type: FormFieldDefinition["type"];
  required: boolean;
  placeholder: string;
  options?: string[];
  widthPercent: number;
}> = [
  {
    labelMl: "അപേക്ഷകന്റെ പേര്",
    labelEn: "Applicant Full Name",
    key: "applicant_name",
    type: "text",
    required: true,
    placeholder: "അപേക്ഷകന്റെ പൂർണ്ണ നാമം",
    widthPercent: 45
  },
  {
    labelMl: "മൊബൈൽ നമ്പർ",
    labelEn: "Mobile Phone Number",
    key: "phone",
    type: "text",
    required: true,
    placeholder: "10-digit mobile number",
    widthPercent: 40
  },
  {
    labelMl: "ആധാർ നമ്പർ",
    labelEn: "Aadhaar Card Number",
    key: "aadhaar_no",
    type: "text",
    required: false,
    placeholder: "12-digit Aadhaar",
    widthPercent: 40
  },
  {
    labelMl: "ഇമെയിൽ വിലാസം",
    labelEn: "Email Address",
    key: "email",
    type: "text",
    required: false,
    placeholder: "example@gmail.com",
    widthPercent: 45
  },
  {
    labelMl: "റവന്യൂ വില്ലേജ്",
    labelEn: "Revenue Village",
    key: "village",
    type: "text",
    required: true,
    placeholder: "വില്ലേജിന്റെ പേര്",
    widthPercent: 45
  },
  {
    labelMl: "താലൂക്ക്",
    labelEn: "Taluk",
    key: "taluk",
    type: "text",
    required: false,
    placeholder: "താലൂക്കിന്റെ പേര്",
    widthPercent: 40
  },
  {
    labelMl: "സർവ്വേ നമ്പർ & സബ്ഡിവിഷൻ",
    labelEn: "Survey & Sub-division No",
    key: "survey_no",
    type: "text",
    required: true,
    placeholder: "ഉദാ: 124/3-B",
    widthPercent: 40
  },
  {
    labelMl: "തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം",
    labelEn: "Panchayat / Municipality",
    key: "local_body",
    type: "text",
    required: true,
    placeholder: "പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി",
    widthPercent: 45
  },
  {
    labelMl: "വാർഡ് നമ്പർ & ഡോർ നമ്പർ",
    labelEn: "Ward & Door Number",
    key: "ward_door_no",
    type: "text",
    required: false,
    placeholder: "വാർഡ് / വീട്ടു നമ്പർ",
    widthPercent: 40
  },
  {
    labelMl: "കെട്ടിട ഉപയോഗ തരം",
    labelEn: "Building Occupancy Category",
    key: "occupancy_category",
    type: "select",
    required: true,
    placeholder: "തിരഞ്ഞെടുക്കുക",
    options: [
      "പാർപ്പിടം (Residential - Group A1)",
      "വാണിജ്യം (Commercial - Group F)",
      "വ്യാവസായികം (Industrial - Group G)",
      "വിദ്യാഭ്യാസ സ്ഥാപനം (Educational - Group B)",
      "പൊതു സമ്മേളനം (Assembly - Group D)",
      "മറ്റുള്ളവ (Others)"
    ],
    widthPercent: 50
  },
  {
    labelMl: "പ്ലിന്ത് ഏരിയ (ചതുരശ്ര അടി)",
    labelEn: "Plinth Area in Sq.Ft",
    key: "plinth_area_sqft",
    type: "number",
    required: true,
    placeholder: "ഉദാ: 1850",
    widthPercent: 35
  },
  {
    labelMl: "നിർമ്മാണ ചെലവ് / എസ്റ്റിമേറ്റ് തുക (₹)",
    labelEn: "Estimated Construction Cost (₹)",
    key: "estimated_cost",
    type: "number",
    required: false,
    placeholder: "തുക രൂപയിൽ",
    widthPercent: 40
  },
  {
    labelMl: "അപേക്ഷാ തീയതി",
    labelEn: "Date of Application",
    key: "application_date",
    type: "date",
    required: true,
    placeholder: "DD/MM/YYYY",
    widthPercent: 35
  },
  {
    labelMl: "പ്രത്യേക കുറിപ്പുകൾ / നിബന്ധനകൾ",
    labelEn: "Remarks & Special Conditions",
    key: "remarks",
    type: "textarea",
    required: false,
    placeholder: "പ്രത്യേക വിവരങ്ങൾ...",
    widthPercent: 90
  }
];

export const FormPdfBuilderView: React.FC<FormPdfBuilderViewProps> = ({
  initialForm,
  onSaveForm,
  onCancel
}) => {
  const [formId] = useState<string>(
    initialForm?.id || `form_custom_${Date.now().toString(36)}`
  );
  const [formName, setFormName] = useState<string>(
    initialForm?.name || "പുതിയ അപേക്ഷാ ഫോം (New Application Form)"
  );
  const [formNameMl, setFormNameMl] = useState<string>(
    initialForm?.nameMl || "പുതിയ അപേക്ഷാ ഫോം"
  );
  const [formCode, setFormCode] = useState<string>(
    initialForm?.code || "LSGD / GOVT FORM"
  );
  const [category, setCategory] = useState<string>(
    initialForm?.category || "തദ്ദേശ സ്വയംഭരണം & സിവിൽ"
  );
  const [description, setDescription] = useState<string>(
    initialForm?.description || "അപേക്ഷകരിൽ നിന്നും വിവരങ്ങൾ ശേഖരിച്ചു സമർപ്പിക്കുവാനുള്ള ഔദ്യോഗിക ഫോറം."
  );

  const [pdfFileName, setPdfFileName] = useState<string | undefined>(
    initialForm?.pdfFileName
  );
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(
    initialForm?.pdfUrl
  );
  const [pdfFileSize, setPdfFileSize] = useState<string | undefined>();
  const [pdfFileType, setPdfFileType] = useState<string | undefined>();

  const [fields, setFields] = useState<FormFieldDefinition[]>(
    initialForm?.fields || [
      {
        id: "fld_1",
        key: "applicant_name",
        label: "അപേക്ഷകന്റെ പേര് (Applicant Name)",
        labelMl: "അപേക്ഷകന്റെ പൂർണ്ണ നാമം",
        labelEn: "Applicant Full Name",
        type: "text",
        required: true,
        placeholder: "പേര് നൽകുക",
        pageNumber: 1,
        xPercent: 10,
        yPercent: 18,
        widthPercent: 40,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "fld_2",
        key: "phone",
        label: "മൊബൈൽ നമ്പർ (Mobile Phone)",
        labelMl: "മൊബൈൽ നമ്പർ",
        labelEn: "Phone Number",
        type: "text",
        required: true,
        placeholder: "10-digit mobile number",
        pageNumber: 1,
        xPercent: 55,
        yPercent: 18,
        widthPercent: 35,
        fontSizePt: 11,
        alignment: "left"
      }
    ]
  );

  // Active right side view tab
  const [viewTab, setViewTab] = useState<"canvas" | "native">("canvas");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFieldOverlays, setShowFieldOverlays] = useState<boolean>(true);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // Field Edit Modal State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormFieldDefinition | null>(null);

  // Modal Form State
  const [fieldLabelMl, setFieldLabelMl] = useState("");
  const [fieldLabelEn, setFieldLabelEn] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldType, setFieldType] = useState<FormFieldDefinition["type"]>("text");
  const [fieldRequired, setFieldRequired] = useState(true);
  const [fieldPlaceholder, setFieldPlaceholder] = useState("");
  const [fieldOptionsText, setFieldOptionsText] = useState("");
  const [fieldPageNumber, setFieldPageNumber] = useState(1);
  const [fieldFontSize, setFieldFontSize] = useState(11);
  const [fieldAlignment, setFieldAlignment] = useState<"left" | "center" | "right">("left");
  const [fieldX, setFieldX] = useState(10);
  const [fieldY, setFieldY] = useState(25);
  const [fieldWidth, setFieldWidth] = useState(40);
  const [modalError, setModalError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Handle PDF / Scanned Document Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    setPdfFileType(file.type || "application/pdf");
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setPdfFileSize(
      file.size > 1024 * 1024
        ? `${sizeInMb} MB`
        : `${Math.round(file.size / 1024)} KB`
    );

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        setPdfUrl(reader.result);
        try {
          const { PDFDocument } = await import("pdf-lib");
          const arrayBuffer = await file.arrayBuffer();
          const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const count = doc.getPageCount();
          if (count && count > 0) {
            setTotalPages(count);
          }
        } catch (e) {
          console.warn("Could not determine page count from PDF:", e);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Open modal to add a field with optional preset coordinates
  const openAddFieldModal = (defaultX?: number, defaultY?: number) => {
    setEditingField(null);
    setFieldLabelMl("");
    setFieldLabelEn("");
    setFieldKey(`field_${Date.now().toString().slice(-4)}`);
    setFieldType("text");
    setFieldRequired(true);
    setFieldPlaceholder("");
    setFieldOptionsText("");
    setFieldPageNumber(currentPage);
    setFieldFontSize(11);
    setFieldAlignment("left");
    setFieldX(defaultX !== undefined ? Math.max(5, Math.min(85, defaultX)) : 10);
    setFieldY(defaultY !== undefined ? Math.max(10, Math.min(88, defaultY)) : 25);
    setFieldWidth(40);
    setModalError("");
    setIsFieldModalOpen(true);
  };

  // Open modal to edit existing field
  const openEditFieldModal = (fld: FormFieldDefinition) => {
    setEditingField(fld);
    setFieldLabelMl(fld.labelMl || fld.label);
    setFieldLabelEn(fld.labelEn || "");
    setFieldKey(fld.key);
    setFieldType(fld.type);
    setFieldRequired(!!fld.required);
    setFieldPlaceholder(fld.placeholder || "");
    setFieldOptionsText((fld.options || []).join("\n"));
    setFieldPageNumber(fld.pageNumber || 1);
    setFieldFontSize(fld.fontSizePt || 11);
    setFieldAlignment(fld.alignment || "left");
    setFieldX(fld.xPercent ?? 10);
    setFieldY(fld.yPercent ?? 25);
    setFieldWidth(fld.widthPercent ?? 40);
    setModalError("");
    setIsFieldModalOpen(true);
  };

  // Add a quick preset field instantly
  const handleAddPresetField = (preset: typeof QUICK_PRESET_FIELDS[0]) => {
    // Check if key already exists, if so append number
    let finalKey = preset.key;
    let count = 1;
    while (fields.some((f) => f.key === finalKey)) {
      finalKey = `${preset.key}_${count++}`;
    }

    // Auto calculate Y position based on current count
    const nextY = Math.min(85, 18 + fields.length * 6);

    const newField: FormFieldDefinition = {
      id: `fld_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      label: `${preset.labelMl} (${preset.labelEn})`,
      labelMl: preset.labelMl,
      labelEn: preset.labelEn,
      key: finalKey,
      type: preset.type,
      required: preset.required,
      placeholder: preset.placeholder,
      options: preset.options,
      pageNumber: currentPage,
      xPercent: 10,
      yPercent: nextY,
      widthPercent: preset.widthPercent,
      fontSizePt: 11,
      alignment: "left"
    };

    setFields([...fields, newField]);
    setActiveFieldId(newField.id);
  };

  // Save Field from Modal
  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryLabel = fieldLabelMl.trim() || fieldLabelEn.trim();
    if (!primaryLabel) {
      setModalError("ഫീൽഡ് നാമം (Label) നൽകേണ്ടതാണ്.");
      return;
    }

    let finalKey = fieldKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!finalKey) {
      finalKey = `field_${Date.now().toString().slice(-4)}`;
    }

    // Prevent duplicate keys if adding new field or changing key
    const isDuplicate = fields.some(
      (f) => f.key === finalKey && (!editingField || f.id !== editingField.id)
    );
    if (isDuplicate) {
      finalKey = `${finalKey}_${Date.now().toString().slice(-3)}`;
    }

    const options =
      fieldType === "select"
        ? fieldOptionsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newField: FormFieldDefinition = {
      id: editingField?.id || `fld_${Date.now().toString(36)}`,
      label: fieldLabelMl.trim() && fieldLabelEn.trim()
        ? `${fieldLabelMl.trim()} (${fieldLabelEn.trim()})`
        : primaryLabel,
      labelMl: fieldLabelMl.trim() || primaryLabel,
      labelEn: fieldLabelEn.trim() || undefined,
      key: finalKey,
      type: fieldType,
      required: fieldRequired,
      placeholder: fieldPlaceholder.trim() || undefined,
      options: options && options.length > 0 ? options : undefined,
      pageNumber: fieldPageNumber || 1,
      xPercent: fieldX,
      yPercent: fieldY,
      widthPercent: fieldWidth,
      fontSizePt: fieldFontSize,
      alignment: fieldAlignment
    };

    if (editingField) {
      setFields(fields.map((f) => (f.id === editingField.id ? newField : f)));
    } else {
      setFields([...fields, newField]);
    }

    setActiveFieldId(newField.id);
    setIsFieldModalOpen(false);
  };

  // Delete Field
  const handleDeleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (activeFieldId === id) setActiveFieldId(null);
  };

  // Move Field Up / Down in the list
  const handleMoveField = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const reordered = [...fields];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setFields(reordered);
  };

  // Handle Click on Document Canvas to place a field directly
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    // If clicked on an existing field element or button, don't trigger new field modal
    const target = e.target as HTMLElement;
    if (target.closest(".field-overlay-badge")) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    openAddFieldModal(xPct, yPct);
  };

  // Save Entire Template
  const handleSaveTemplate = () => {
    const finalName = formNameMl.trim() || formName.trim();
    if (!finalName) {
      alert("ദയവായി ഫോമിന്റെ പേര് രേഖപ്പെടുത്തുക.");
      return;
    }

    const template: ApplicationFormTemplate = {
      id: formId,
      name: formName.trim() || finalName,
      nameMl: formNameMl.trim() || finalName,
      code: formCode.trim() || "APPLICATION FORM",
      category: category.trim() || "തദ്ദേശ സ്വയംഭരണം & സിവിൽ",
      description: description.trim(),
      pdfUrl: pdfUrl,
      pdfFileName: pdfFileName,
      fields: fields,
      createdAt: initialForm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: initialForm?.isDefault || false
    };

    onSaveForm(template);
  };

  const isImageAttachment = pdfUrl?.startsWith("data:image/");

  return (
    <div className="space-y-6">
      {/* Top Header & Save Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition cursor-pointer"
            title="റദ്ദാക്കുക (Cancel)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> PDF ഫോം ഡിസൈനർ & ഫീൽഡ് ബിൽഡർ (PDF Form Designer)
            </span>
            <h1 className="text-lg font-extrabold text-white mt-0.5">
              {formNameMl || formName || "അപേക്ഷാ ഫോം നിർമ്മിക്കുക"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            റദ്ദാക്കുക (Cancel)
          </button>
          <button
            type="button"
            onClick={handleSaveTemplate}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>ഫോം സേവ് ചെയ്യുക (Save Form)</span>
          </button>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Details, Quick Presets & Configured Fields */}
        <div className="lg:col-span-6 space-y-6">
          {/* Form Properties Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-indigo-400" />
              അപേക്ഷാ ഫോം വിവരങ്ങൾ (Form Details)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ഫോം നാമം - മലയാളം (Form Name in Malayalam) *
              </label>
              <input
                type="text"
                required
                value={formNameMl}
                onChange={(e) => {
                  setFormNameMl(e.target.value);
                  if (!formName || formName === formNameMl) setFormName(e.target.value);
                }}
                placeholder="ഉദാ: വാണിജ്യ ലൈസൻസ് അപേക്ഷ / വസ്തു നികുതി ഫോറം"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ഫോം നാമം - ഇംഗ്ലീഷ് / ദ്വിഭാഷ (Form Name in English / Bilingual)
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Trade License Application Form / Property Tax"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ഫോം കോഡ് (Form Code)
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="ഉദാ: FORM-04 / LSGD-21"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  വിഭാഗം (Category)
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="തദ്ദേശ സ്വയംഭരണം / റവന്യൂ / കെട്ടിട നിർമ്മാണം"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                വിവരണം / ചട്ടങ്ങൾ (Description / Instructions)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="അപേക്ഷ സംബന്ധിച്ച പ്രത്യേക വിവരണം..."
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans resize-none"
              />
            </div>
          </div>

          {/* Quick Preset Fields Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                പെട്ടെന്ന് ചേർക്കാവുന്ന കേരള ഫോം ഫീൽഡുകൾ (Quick Preset Fields)
              </h3>
              <span className="text-[10px] text-slate-400">ക്ലിക്ക് ചെയ്ത് ചേർക്കുക</span>
            </div>
            <p className="text-[11px] text-slate-400">
              സാധാരണ അപേക്ഷകളിൽ ആവശ്യമുള്ള ഫീൽഡുകൾ ഒറ്റ ക്ലിക്കിലൂടെ ഫോമിലേക്ക് ചേർക്കാം:
            </p>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {QUICK_PRESET_FIELDS.map((preset) => {
                const isAlreadyAdded = fields.some((f) => f.key === preset.key);
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleAddPresetField(preset)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1 cursor-pointer ${
                      isAlreadyAdded
                        ? "bg-slate-800/90 text-indigo-300 border-indigo-700/50 hover:bg-slate-700"
                        : "bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-indigo-900/40 hover:text-white hover:border-indigo-500"
                    }`}
                    title={`${preset.labelEn} (${preset.type})`}
                  >
                    <Plus className="w-3 h-3 text-indigo-400" />
                    <span>{preset.labelMl}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fields List & Add Field */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Languages className="w-4 h-4 text-emerald-400" />
                  ഫോം ഫീൽഡുകൾ (Form Fields - {fields.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ഫീൽഡുകൾ ക്രമീകരിക്കാനും എഡിറ്റ് ചെയ്യാനും സാധിക്കും
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAddFieldModal()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ പുതിയ ഫീൽഡ് ചേർക്കുക</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {fields.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                  ഇതുവരെ ഫീൽഡുകൾ ചേർത്തിട്ടില്ല. മുകളിലെ "+ പുതിയ ഫീൽഡ്" അല്ലെങ്കിൽ ദ്രുത ഫീൽഡുകൾ ക്ലിക്ക് ചെയ്യുക.
                </div>
              ) : (
                fields.map((fld, idx) => (
                  <div
                    key={fld.id}
                    onClick={() => setActiveFieldId(fld.id)}
                    className={`p-3 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer border ${
                      activeFieldId === fld.id
                        ? "bg-indigo-950/40 border-indigo-500 shadow-md"
                        : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{fld.labelMl || fld.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                            {fld.type}
                          </span>
                          {fld.required && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                              Req
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          key: <span className="text-indigo-300">{fld.key}</span>
                          {fld.labelEn && <span> • {fld.labelEn}</span>}
                          <span className="text-slate-500 ml-2">
                            (X: {fld.xPercent ?? 10}%, Y: {fld.yPercent ?? 20}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Move up / down */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveField(idx, "up");
                        }}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition"
                        title="മുകളിലേക്ക് നീക്കുക"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === fields.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveField(idx, "down");
                        }}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition"
                        title="താഴേക്ക് നീക്കുക"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditFieldModal(fld);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                        title="എഡിറ്റ് ചെയ്യുക"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`"${fld.labelMl || fld.label}" ഫീൽഡ് നീക്കം ചെയ്യണോ?`)) {
                            handleDeleteField(fld.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition"
                        title="കളയുക"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: PDF Document Upload, Real Viewer & Interactive Canvas */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-cyan-400" />
                  ഔദ്യോഗിക PDF രേഖ (Official PDF Document)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  അറ്റാച്ച് ചെയ്യുക, പരിശോധിക്കുക, ഫീൽഡുകൾ വിന്യസിക്കുക
                </p>
              </div>

              {/* View Tab Buttons */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewTab("canvas")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    viewTab === "canvas"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>ഫീൽഡ് ക്യാൻവാസ്</span>
                </button>
                <button
                  type="button"
                  disabled={!pdfUrl}
                  onClick={() => setViewTab("native")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 disabled:opacity-40 ${
                    viewTab === "native"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title={pdfUrl ? "യഥാർത്ഥ PDF കാണുക" : "ആദ്യം PDF അപ്‌ലോഡ് ചെയ്യുക"}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>യഥാർത്ഥ PDF</span>
                </button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
            />

            {/* Drop / Upload Zone & Status */}
            {!pdfUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-800/30 hover:bg-slate-800/60"
              >
                <UploadCloud className="w-10 h-10 mx-auto text-indigo-400 mb-2" />
                <div className="text-sm font-bold text-white">
                  അപേക്ഷാ ഫോം PDF ഫയൽ തിരഞ്ഞെടുക്കുക (Upload Application PDF)
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  സർക്കാർ ഉത്തരവുകൾ, മുനിസിപ്പാലിറ്റി/പഞ്ചായത്ത് അപേക്ഷാ ഫോം, സ്കാൻ ചെയ്ത PDF അല്ലെങ്കിൽ ഇമേജ് തിരഞ്ഞെടുക്കുക
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-mono">
                    .PDF, .PNG, .JPG, .WEBP
                  </span>
                  <span className="px-3 py-1 bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 rounded-lg text-[11px] font-bold">
                    + ഫയൽ തിരഞ്ഞെടുക്കുക
                  </span>
                </div>
              </div>
            ) : (
              /* Attached PDF Info Bar */
              <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate max-w-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{pdfFileName || "അറ്റാച്ച് ചെയ്ത PDF ഫയൽ"}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      {pdfFileSize && <span>വലിപ്പം: {pdfFileSize}</span>}
                      {pdfFileType && <span>• {pdfFileType}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    title="മറ്റൊരു PDF അപ്‌ലോഡ് ചെയ്യുക"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                    <span>മാറ്റുക</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (pdfUrl) {
                        const win = window.open();
                        if (win) {
                          win.document.write(
                            `<iframe src="${pdfUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                          );
                        }
                      }
                    }}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    title="പുതിയ വിൻഡോയിൽ തുറക്കുക"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    <span>തുറക്കുക</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (pdfUrl) {
                        const a = document.createElement("a");
                        a.href = pdfUrl;
                        a.download = pdfFileName || "attached_document.pdf";
                        a.click();
                      }
                    }}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    title="ഡൗൺലോഡ്"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("അറ്റാച്ച് ചെയ്ത PDF നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?")) {
                        setPdfFileName(undefined);
                        setPdfUrl(undefined);
                        setPdfFileSize(undefined);
                        setPdfFileType(undefined);
                        setViewTab("canvas");
                      }
                    }}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                    title="നീക്കം ചെയ്യുക"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Document Controls Bar (Zoom & Toggles) */}
            <div className="flex items-center justify-between text-xs bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold">സൂം:</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                  title="സൂം കുറയ്ക്കുക"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-indigo-300 font-bold w-10 text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(130, z + 15))}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                  title="സൂം കൂട്ടുക"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={showFieldOverlays}
                    onChange={(e) => setShowFieldOverlays(e.target.checked)}
                    className="w-3.5 h-3.5 accent-indigo-500 rounded"
                  />
                  <span>ഫീൽഡുകൾ കാണിക്കുക</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {fields.length} ഫീൽഡുകൾ
                </span>
              </div>
            </div>

            {/* VIEW TAB 1: INTERACTIVE CANVAS WITH DIRECT FIELD PLACEMENT */}
            {viewTab === "canvas" && (
              <div className="space-y-2">
                <div className="text-[11px] text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>
                      ഷീറ്റിൽ എവിടെയും <strong>ക്ലിക്ക് ചെയ്ത്</strong> ആ സ്ഥാനത്ത് ഫീൽഡ് ചേർക്കാം. ഫീൽഡിൽ ക്ലിക്ക് ചെയ്താൽ എഡിറ്റ് ചെയ്യാം.
                    </span>
                  </span>
                </div>

                {/* Canvas Outer Scroller */}
                <div className="w-full overflow-auto max-h-[600px] border border-slate-700/80 rounded-2xl bg-slate-950/90 p-4 flex justify-center shadow-inner">
                  {/* A4 Sheet Surface */}
                  <div
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{
                      width: `${(595 * zoomLevel) / 100}px`,
                      minHeight: `${(842 * zoomLevel) / 100}px`,
                      aspectRatio: "1 / 1.414"
                    }}
                    className="bg-white text-slate-900 rounded-lg shadow-2xl relative select-none border border-slate-300 transition-all cursor-crosshair overflow-hidden"
                  >
                    {/* Background Document / PDF Embed */}
                    {pdfUrl ? (
                      isImageAttachment ? (
                        <img
                          src={pdfUrl}
                          alt="Uploaded Document"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90"
                        />
                      ) : (
                        <iframe
                          key={`page-${currentPage}`}
                          src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0`}
                          title="Attached PDF Preview"
                          className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-90"
                        />
                      )
                    ) : (
                      /* Blank Sheet Header Wireframe when no PDF is attached */
                      <div className="p-6 border-b border-slate-200 pointer-events-none">
                        <div className="text-center space-y-1">
                          <div className="text-[10px] tracking-widest uppercase font-bold text-slate-500">
                            GOVERNMENT OF KERALA / തദ്ദേശ സ്വയംഭരണ വകുപ്പ്
                          </div>
                          <h2 className="text-base font-extrabold text-slate-900">
                            {formNameMl || "അപേക്ഷാ ഫോറം"}
                          </h2>
                          <div className="text-[11px] text-slate-600 font-medium">
                            {formName} • {formCode} (പേജ് {currentPage})
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Overlay Layer: Interactive Placed Fields */}
                    {showFieldOverlays &&
                      fields
                        .filter((fld) => (fld.pageNumber || 1) === currentPage)
                        .map((fld, idx) => {
                        const isSelected = activeFieldId === fld.id;
                        const leftPct = fld.xPercent ?? 10;
                        const topPct = fld.yPercent ?? 20;
                        const widthPct = fld.widthPercent ?? 40;

                        return (
                          <div
                            key={fld.id}
                            style={{
                              left: `${leftPct}%`,
                              top: `${topPct}%`,
                              width: `${widthPct}%`
                            }}
                            className={`field-overlay-badge absolute z-10 p-1.5 rounded-lg border text-left shadow-lg backdrop-blur-md transition cursor-pointer select-none ${
                              isSelected
                                ? "bg-indigo-600/95 text-white border-indigo-300 ring-2 ring-indigo-400 shadow-indigo-600/50"
                                : "bg-slate-900/90 text-slate-100 border-indigo-500/70 hover:bg-slate-900 hover:border-indigo-400"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFieldId(fld.id);
                              openEditFieldModal(fld);
                            }}
                            title={`ക്ലിക്ക് ചെയ്ത് എഡിറ്റ് ചെയ്യുക: ${fld.labelMl || fld.label} (${fld.type})`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="w-4 h-4 rounded bg-indigo-500 text-white font-mono text-[9px] flex items-center justify-center font-bold shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-[10px] font-bold truncate">
                                  {fld.labelMl || fld.label}
                                </span>
                              </div>
                              <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-slate-800 text-indigo-300 shrink-0">
                                {fld.type}
                              </span>
                            </div>

                            {/* Simulated Field Input Box */}
                            <div className="h-5 bg-white/10 border border-white/20 rounded px-1.5 flex items-center text-[9px] text-slate-300 font-mono truncate">
                              {fld.placeholder || `[ ${fld.key} ]`}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW TAB 2: NATIVE PDF EMBED VIEWER */}
            {viewTab === "native" && pdfUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>യഥാർത്ഥ അപേക്ഷാ PDF സ്ക്രോൾ ചെയ്ത് വായിക്കാം</span>
                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open();
                      if (win) {
                        win.document.write(
                          `<iframe src="${pdfUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                        );
                      }
                    }}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <Maximize2 className="w-3 h-3" /> പൂർണ്ണ സ്ക്രീനിൽ കാണുക
                  </button>
                </div>

                <div className="w-full h-[620px] rounded-2xl overflow-hidden border border-slate-700 bg-white shadow-2xl">
                  {isImageAttachment ? (
                    <img
                      src={pdfUrl}
                      alt="Uploaded Document"
                      className="w-full h-full object-contain bg-slate-900"
                    />
                  ) : (
                    <iframe
                      src={`${pdfUrl}#toolbar=1`}
                      title="Native PDF Viewer"
                      className="w-full h-full border-0"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Field Add / Edit Modal */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-indigo-950 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                {editingField ? "ഫീൽഡ് എഡിറ്റ് ചെയ്യുക (Edit Field)" : "പുതിയ ഫീൽഡ് ചേർക്കുക (Add Field)"}
              </h2>
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveField} className="p-6 space-y-4">
              {modalError && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ഫീൽഡ് ലേബൽ - മലയാളം (Label in Malayalam) *
                </label>
                <input
                  type="text"
                  required
                  value={fieldLabelMl}
                  onChange={(e) => {
                    setFieldLabelMl(e.target.value);
                    if (!fieldKey || fieldKey.startsWith("field_")) {
                      // Attempt basic transliteration/key suggestion
                      setFieldKey(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "_")
                          .replace(/^_+|_+$/g, "") || `field_${Date.now().toString().slice(-4)}`
                      );
                    }
                  }}
                  placeholder="ഉദാ: വില്ലേജ് / വാർഡ് നമ്പർ / അപേക്ഷകന്റെ പേര്"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ഫീൽഡ് ലേബൽ - ഇംഗ്ലീഷ് (Label in English)
                </label>
                <input
                  type="text"
                  value={fieldLabelEn}
                  onChange={(e) => {
                    setFieldLabelEn(e.target.value);
                    if (!fieldKey || fieldKey.startsWith("field_")) {
                      setFieldKey(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "_")
                          .replace(/^_+|_+$/g, "")
                      );
                    }
                  }}
                  placeholder="Village / Ward Number / Applicant Name"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ഫീൽഡ് തരം (Input Type)
                  </label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="text">Text (അക്ഷരങ്ങൾ / ഒറ്റവരി)</option>
                    <option value="number">Number (സംഖ്യകൾ)</option>
                    <option value="date">Date (തീയതി)</option>
                    <option value="textarea">Textarea (വിവരണങ്ങൾ / Multi-line)</option>
                    <option value="checkbox">Checkbox (ഉണ്ട് / ഇല്ല)</option>
                    <option value="signature">Signature (ഒപ്പ് / Initial Box)</option>
                    <option value="select">Dropdown (ഓപ്ഷനുകൾ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ഫീൽഡ് കീ (Data Key) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fieldKey}
                    onChange={(e) => setFieldKey(e.target.value)}
                    placeholder="e.g. ward_no"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Page Number, Font Size, and Alignment */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    പേജ് നമ്പർ (Page)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={fieldPageNumber}
                    onChange={(e) => setFieldPageNumber(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ഫോണ്ട് വലിപ്പം (Font Pt)
                  </label>
                  <select
                    value={fieldFontSize}
                    onChange={(e) => setFieldFontSize(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {[8, 9, 10, 11, 12, 13, 14, 16, 18, 20].map((sz) => (
                      <option key={sz} value={sz}>{sz} pt</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    വിന്യാസം (Align)
                  </label>
                  <select
                    value={fieldAlignment}
                    onChange={(e) => setFieldAlignment(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="left">ഇടത് (Left)</option>
                    <option value="center">മധ്യം (Center)</option>
                    <option value="right">വലത് (Right)</option>
                  </select>
                </div>
              </div>

              {fieldType === "select" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ഓപ്ഷനുകൾ (Options - ഓരോ വരിയിലും ഓരോന്ന്)
                  </label>
                  <textarea
                    rows={3}
                    value={fieldOptionsText}
                    onChange={(e) => setFieldOptionsText(e.target.value)}
                    placeholder={"ഗ്രാമപഞ്ചായത്ത്\nമുനിസിപ്പാലിറ്റി\nകോർപ്പറേഷൻ"}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-sans resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Placeholder / സൂചന
                </label>
                <input
                  type="text"
                  value={fieldPlaceholder}
                  onChange={(e) => setFieldPlaceholder(e.target.value)}
                  placeholder="വിവരം നൽകുക..."
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Coordinates Sliders */}
              <div className="p-3 bg-slate-800/50 border border-slate-700/80 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-indigo-300 block">
                  ഷീറ്റിലെ സ്ഥാനം & വിസ്താരം (Coordinates & Size)
                </span>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      ഇടത്തുനിന്ന് (X): <span className="font-mono text-white font-bold">{fieldX}%</span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="90"
                      value={fieldX}
                      onChange={(e) => setFieldX(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      മുകളിൽനിന്ന് (Y): <span className="font-mono text-white font-bold">{fieldY}%</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="92"
                      value={fieldY}
                      onChange={(e) => setFieldY(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      നീളം (Width): <span className="font-mono text-white font-bold">{fieldWidth}%</span>
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="90"
                      value={fieldWidth}
                      onChange={(e) => setFieldWidth(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req_toggle"
                  checked={fieldRequired}
                  onChange={(e) => setFieldRequired(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
                <label htmlFor="req_toggle" className="text-xs text-slate-300 cursor-pointer select-none">
                  നിർബന്ധമായും പൂരിപ്പിക്കേണ്ട ഫീൽഡ് (Required Field)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow cursor-pointer"
                >
                  ഫീൽഡ് സേവ് ചെയ്യുക (Save Field)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
