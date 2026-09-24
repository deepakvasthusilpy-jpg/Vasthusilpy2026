import React, { useState, useEffect } from "react";
import { ImportantSite, ImportantSiteCategory, SiteFolder } from "../../../types";
import { generateStrongPassword, loadSiteFolders } from "../../../utils/importantSitesManager";
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
  Folder,
  FolderPlus
} from "lucide-react";

interface NewEditSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (site: ImportantSite) => void;
  siteToEdit?: ImportantSite | null;
  defaultFolder?: string;
  folders?: SiteFolder[];
  onAddNewFolder?: (name: string) => void;
}

const COLOR_OPTIONS = [
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500", border: "border-emerald-400" },
  { id: "cyan", label: "Cyan", bg: "bg-cyan-500", border: "border-cyan-400" },
  { id: "blue", label: "Blue", bg: "bg-blue-500", border: "border-blue-400" },
  { id: "indigo", label: "Indigo", bg: "bg-indigo-500", border: "border-indigo-400" },
  { id: "purple", label: "Purple", bg: "bg-purple-500", border: "border-purple-400" },
  { id: "amber", label: "Amber", bg: "bg-amber-500", border: "border-amber-400" },
  { id: "rose", label: "Rose", bg: "bg-rose-500", border: "border-rose-400" },
  { id: "teal", label: "Teal", bg: "bg-teal-500", border: "border-teal-400" }
];

export const NewEditSiteModal: React.FC<NewEditSiteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  siteToEdit,
  defaultFolder,
  folders = [],
  onAddNewFolder
}) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [folder, setFolder] = useState("VEO");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [color, setColor] = useState("emerald");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedToast, setGeneratedToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableFolders = folders.length > 0 ? folders : loadSiteFolders();

  useEffect(() => {
    if (siteToEdit) {
      setName(siteToEdit.name || "");
      setUrl(siteToEdit.url || "");
      setFolder(siteToEdit.folder || siteToEdit.customCategory || "VEO");
      setUsername(siteToEdit.username || "");
      setPassword(siteToEdit.password || "");
      setSecurityPin(siteToEdit.securityPin || "");
      setNotes(siteToEdit.notes || "");
      setIsFavorite(!!siteToEdit.isFavorite);
      setColor(siteToEdit.color || "emerald");
    } else {
      setName("");
      setUrl("");
      setFolder(defaultFolder || (availableFolders[0]?.name || "VEO"));
      setUsername("");
      setPassword("");
      setSecurityPin("");
      setNotes("");
      setIsFavorite(false);
      setColor("emerald");
    }
    setIsCreatingFolder(false);
    setNewFolderName("");
    setShowPassword(false);
    setErrors({});
  }, [siteToEdit, isOpen, defaultFolder]);

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

  const handleCreateNewFolder = () => {
    if (!newFolderName.trim()) return;
    const cleanName = newFolderName.trim();
    if (onAddNewFolder) {
      onAddNewFolder(cleanName);
    }
    setFolder(cleanName);
    setIsCreatingFolder(false);
    setNewFolderName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Please provide website or link name";
    }

    let formattedUrl = url.trim();
    if (!formattedUrl) {
      newErrors.url = "Please enter website or portal URL";
    } else {
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = "https://" + formattedUrl;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const targetFolder = isCreatingFolder && newFolderName.trim() ? newFolderName.trim() : (folder.trim() || "General");

    const savedSite: ImportantSite = {
      id: siteToEdit?.id || `site_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category: "OTHER",
      customCategory: targetFolder,
      folder: targetFolder,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl my-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {siteToEdit ? "Edit Website Link" : "Add New Website Link"}
              </h3>
              <p className="text-xs text-slate-400">
                Save portal URL, folder, and optional credentials for instant access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Site Name & Favorite Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-9 space-y-1.5">
              <label className="block text-slate-300 font-bold">
                Website / Form Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="e.g. VEO Form, KSEB Portal, Panchayath Service..."
                className={`w-full bg-slate-950 border ${
                  errors.name ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-700"
                } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition`}
                autoFocus
              />
              {errors.name && <p className="text-[11px] text-rose-400">{errors.name}</p>}
            </div>

            <div className="sm:col-span-3 flex sm:flex-col justify-between sm:justify-center items-start sm:items-center bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[11px] text-slate-400 font-bold">Favorite</span>
              <button
                type="button"
                onClick={() => setIsFavorite((prev) => !prev)}
                className={`mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition ${
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

          {/* Website Link URL */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold">
              Website / Form URL <span className="text-emerald-400">*</span>
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
                placeholder="https://forms.fillout.com/t/rckeaFvH5ous"
                className={`w-full bg-slate-950 border ${
                  errors.url ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-700"
                } rounded-xl pl-3.5 pr-24 py-2.5 text-sm text-cyan-300 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition`}
              />
              {url && (
                <a
                  href={url.startsWith("http") ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 top-2 px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Test Link</span>
                </a>
              )}
            </div>
            {errors.url && <p className="text-[11px] text-rose-400">{errors.url}</p>}
          </div>

          {/* Folder Selection & Inline Folder Creator */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-emerald-400" />
                Folder Option
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{isCreatingFolder ? "Choose Existing" : "+ New Folder"}</span>
              </button>
            </div>

            {isCreatingFolder ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter new folder name (e.g. VEO, Survey, KSEB)"
                  className="flex-1 bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateNewFolder}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition"
                >
                  Add Folder
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {availableFolders.map((f) => {
                  const isSelected = folder.toLowerCase() === f.name.toLowerCase();
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFolder(f.name)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                        isSelected
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20"
                          : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white"
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5" />
                      <span>{f.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Credentials Vault (Optional) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Login Credentials (Optional)
              </span>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate Password</span>
              </button>
            </div>

            {generatedToast && (
              <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 rounded-xl text-[11px] text-center font-bold animate-fadeIn">
                ✨ Strong 16-character password generated & populated!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400 font-semibold">Username / Login ID</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. user@domain.com or ID"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400 font-semibold">Password / Security Key</label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Optional portal password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-9 py-2 text-amber-300 font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  {password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Color & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 space-y-1.5">
              <label className="block text-slate-300 font-bold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                Color Tag
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => {
                  const isSelected = color === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`w-7 h-7 rounded-xl ${c.bg} flex items-center justify-center transition cursor-pointer ${
                        isSelected ? "ring-2 ring-white scale-110 shadow-md" : "opacity-60 hover:opacity-100"
                      }`}
                      title={c.label}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-6 space-y-1.5">
              <label className="block text-slate-300 font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Notes / Purpose
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. For Village Extension Office form submission"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{siteToEdit ? "Save Changes" : "Add Website Link"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
