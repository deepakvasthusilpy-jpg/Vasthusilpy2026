import React, { useState, useEffect } from "react";
import { ImportantSite, ImportantSiteCategory } from "../../../types";
import { generateStrongPassword } from "../../../utils/importantSitesManager";
import {
  X,
  Globe,
  Lock,
  User,
  KeyRound,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  Star,
  FileText,
  Palette,
  ExternalLink,
  Check,
  RefreshCw
} from "lucide-react";

interface NewEditSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (site: ImportantSite) => void;
  siteToEdit?: ImportantSite | null;
}

const CATEGORY_OPTIONS: { id: ImportantSiteCategory; label: string; subLabel: string; color: string }[] = [
  { id: "LSGD_GOVT", label: "LSGD & Building Permits", subLabel: "Permits & LSGD", color: "text-emerald-400 border-emerald-800 bg-emerald-950/40" },
  { id: "REVENUE_SURVEY", label: "Revenue & Land Survey", subLabel: "Revenue & Survey", color: "text-cyan-400 border-cyan-800 bg-cyan-950/40" },
  { id: "TAX_BANKING", label: "GST, Tax & Banking", subLabel: "Tax, GST & Banking", color: "text-indigo-400 border-indigo-800 bg-indigo-950/40" },
  { id: "CAD_SOFTWARE", label: "CAD, Design & DSR", subLabel: "CAD, Design & DSR", color: "text-rose-400 border-rose-800 bg-rose-950/40" },
  { id: "UTILITY_OFFICE", label: "Office & Utilities", subLabel: "Office & Utilities", color: "text-amber-400 border-amber-800 bg-amber-950/40" },
  { id: "OTHER", label: "Other / Custom Portals", subLabel: "Other Portals", color: "text-slate-300 border-slate-700 bg-slate-800/60" }
];

const COLOR_OPTIONS = [
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500", border: "border-emerald-400" },
  { id: "cyan", label: "Cyan", bg: "bg-cyan-500", border: "border-cyan-400" },
  { id: "blue", label: "Blue", bg: "bg-blue-500", border: "border-blue-400" },
  { id: "indigo", label: "Indigo", bg: "bg-indigo-500", border: "border-indigo-400" },
  { id: "amber", label: "Amber", bg: "bg-amber-500", border: "border-amber-400" },
  { id: "rose", label: "Rose", bg: "bg-rose-500", border: "border-rose-400" }
];

export const NewEditSiteModal: React.FC<NewEditSiteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  siteToEdit
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ImportantSiteCategory>("LSGD_GOVT");
  const [customCategory, setCustomCategory] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [color, setColor] = useState("emerald");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedToast, setGeneratedToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (siteToEdit) {
      setName(siteToEdit.name || "");
      setCategory(siteToEdit.category || "LSGD_GOVT");
      setCustomCategory(siteToEdit.customCategory || "");
      setUrl(siteToEdit.url || "");
      setUsername(siteToEdit.username || "");
      setPassword(siteToEdit.password || "");
      setSecurityPin(siteToEdit.securityPin || "");
      setNotes(siteToEdit.notes || "");
      setIsFavorite(!!siteToEdit.isFavorite);
      setColor(siteToEdit.color || "emerald");
    } else {
      setName("");
      setCategory("LSGD_GOVT");
      setCustomCategory("");
      setUrl("");
      setUsername("");
      setPassword("");
      setSecurityPin("");
      setNotes("");
      setIsFavorite(false);
      setColor("emerald");
    }
    setShowPassword(false);
    setErrors({});
  }, [siteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const newPass = generateStrongPassword(16, true);
    setPassword(newPass);
    setShowPassword(true);
    setGeneratedToast(true);
    setTimeout(() => setGeneratedToast(false), 2000);
  };

  const handleUrlBlur = () => {
    let clean = url.trim();
    if (clean && !clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
      setUrl(clean);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Please provide website or portal name";
    }

    let formattedUrl = url.trim();
    if (!formattedUrl) {
      newErrors.url = "Please enter website login URL";
    } else {
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = "https://" + formattedUrl;
      }
    }

    if (!username.trim()) {
      newErrors.username = "Please enter username, email, or user ID";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const savedSite: ImportantSite = {
      id: siteToEdit?.id || `site_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      category,
      customCategory: category === "OTHER" ? customCategory.trim() : undefined,
      url: formattedUrl,
      username: username.trim(),
      password: password,
      securityPin: securityPin.trim() || undefined,
      notes: notes.trim() || undefined,
      isFavorite,
      color,
      lastOpenedAt: siteToEdit?.lastOpenedAt,
      createdAt: siteToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(savedSite);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-6 shadow-2xl my-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-sans uppercase tracking-wide">
                {siteToEdit ? "Edit Important Site & Credentials" : "Add Important Website / Portal"}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Store login URL, username, password & auto-fill provisions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Site Name & Favorite Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-9 space-y-1.5">
              <label className="block text-slate-300 font-bold font-mono">
                Website / Portal Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="e.g. K-SMART LSGD Permit Portal, e-Rekha Survey, GST Portal"
                className={`w-full bg-slate-950 border ${
                  errors.name ? "border-red-500 ring-1 ring-red-500" : "border-slate-700"
                } rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors`}
              />
              {errors.name && <p className="text-[11px] text-red-400 font-mono">{errors.name}</p>}
            </div>

            <div className="sm:col-span-3 flex sm:flex-col justify-between sm:justify-center items-start sm:items-center bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[11px] font-mono text-slate-400 font-bold">Favorite</span>
              <button
                type="button"
                onClick={() => setIsFavorite((prev) => !prev)}
                className={`mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-xs cursor-pointer transition-all ${
                  isFavorite
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-slate-950" : ""}`} />
                <span>{isFavorite ? "Pinned" : "Pin"}</span>
              </button>
            </div>
          </div>

          {/* Website Login URL */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold font-mono">
              Website / Login URL <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errors.url) setErrors((prev) => ({ ...prev, url: "" }));
                }}
                onBlur={handleUrlBlur}
                placeholder="https://ksmart.lsgkerala.gov.in/ui/web-portal"
                className={`w-full bg-slate-950 border ${
                  errors.url ? "border-red-500 ring-1 ring-red-500" : "border-slate-700"
                } rounded-xl pl-3.5 pr-24 py-2.5 text-cyan-300 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors`}
              />
              {url && (
                <a
                  href={url.startsWith("http") ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 top-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[10px] font-mono flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  <span>Test URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {errors.url && <p className="text-[11px] text-red-400 font-mono">{errors.url}</p>}
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold font-mono">Category / Classification</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    category === cat.id
                      ? `${cat.color} ring-1 ring-emerald-400 font-black shadow-md`
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <div className="font-mono font-bold text-xs truncate">{cat.label}</div>
                  <div className="text-[10px] opacity-75 truncate">{cat.subLabel}</div>
                </button>
              ))}
            </div>
            {category === "OTHER" && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name..."
                className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono"
              />
            )}
          </div>

          {/* Credentials Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-slate-200 font-bold font-mono">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Login Credentials Storage & Autofill</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Encrypted & Persisted
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Username / Email */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-bold font-mono">
                  Username / Email / User ID <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors((prev) => ({ ...prev, username: "" }));
                    }}
                    placeholder="e.g. vasthusilpy@gmail.com / KL123"
                    className={`w-full bg-slate-900 border ${
                      errors.username ? "border-red-500" : "border-slate-700"
                    } rounded-xl pl-9 pr-3 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400`}
                  />
                </div>
                {errors.username && <p className="text-[11px] text-red-400 font-mono">{errors.username}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold font-mono">Password</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold cursor-pointer"
                    title="Generate secure randomized password"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-Gen</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter or generate password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {generatedToast && (
                  <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" /> Strong randomized password generated!
                  </p>
                )}
              </div>
            </div>

            {/* Optional Security PIN / Secret Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="block text-slate-400 font-mono text-[11px]">
                  Security PIN / Transaction Code / OTP Mobile (Optional)
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={securityPin}
                    onChange={(e) => setSecurityPin(e.target.value)}
                    placeholder="e.g. 4-digit PIN, Reg No, or OTP Phone"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Color Tag */}
              <div className="space-y-1">
                <label className="block text-slate-400 font-mono text-[11px]">Card Accent Color</label>
                <div className="flex items-center gap-2 pt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`w-6 h-6 rounded-full ${c.bg} transition-all cursor-pointer ${
                        color === c.id ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-60 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Special Instructions */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold font-mono">
              Notes & Login Hints (e.g. OTP instructions, renewal date)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. OTP is sent to Deepak's mobile number. Renewal required every 3 years. Sub-Registrar Office Code: SRO-104."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-xs font-sans"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl font-mono text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl font-mono text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{siteToEdit ? "Update Site Details" : "Save Website & Credentials"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
