import React, { useState } from "react";
import { X, Upload, FileText, Image as ImageIcon, Trash2, Download, Paperclip } from "lucide-react";
import { EstimateProject } from "../../../data/estimateData";

interface AttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: EstimateProject;
}

interface AttachmentFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

export const AttachmentsModal: React.FC<AttachmentsModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([
    {
      id: "att_1",
      name: "Approved_Building_Plan_536_44.pdf",
      size: "2.4 MB",
      type: "application/pdf",
      uploadedAt: "2026-07-08"
    },
    {
      id: "att_2",
      name: "Site_Foundation_Photo_Mannur.jpg",
      size: "1.8 MB",
      type: "image/jpeg",
      uploadedAt: "2026-07-08"
    }
  ]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    const newFiles: AttachmentFile[] = files.map((file, i) => ({
      id: `att_${Date.now()}_${i}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type,
      uploadedAt: new Date().toISOString().split("T")[0]
    }));
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleRemove = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Paperclip className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-100 font-sans">
              Attachments & Site Documents — <span className="font-mono text-emerald-400">{project.id} ({attachments.length})</span>
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Upload Dropzone Area */}
          <label className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.dwg"
            />
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-200 font-sans">
              Click to Upload Site Blueprints, Site Photos, or Permits
            </span>
            <span className="text-[11px] font-mono text-slate-400 mt-1">
              Supports PDF, PNG, JPG, CAD drawings, land documents
            </span>
          </label>

          {/* Attachments List */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              ATTACHED DOCUMENTS ({attachments.length})
            </h4>

            {attachments.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-mono text-xs italic bg-slate-950/40 rounded-xl border border-slate-800">
                No attachments uploaded for this estimate yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 shrink-0">
                        {att.type.includes("image") ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-200 truncate font-mono">
                          {att.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                          <span>{att.size}</span>
                          <span>•</span>
                          <span>Uploaded {att.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => alert(`Downloading ${att.name}`)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(att.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs font-mono transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
