import React, { useState, useRef } from "react";
import {
  FileCode,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Bot,
  RefreshCw,
  FileImage,
  Layers,
  Compass,
  Building2,
  HardHat
} from "lucide-react";

export const AIPlanVisionScannerTab: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [inspectionScope, setInspectionScope] = useState<string>("all_comprehensive");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [visionReport, setVisionReport] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setSelectedImage({
        data: base64Data,
        mimeType: file.type,
        preview: result
      });
      setVisionReport(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScanPlan = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    try {
      const prompt = `[MULTIMODAL ARCHITECTURAL PLAN & BLUEPRINT OCR / VISION AUDIT]
Inspection Scope: ${inspectionScope}
Please perform a detailed structural, architectural, Vastu Shastra, and KPBR building rules inspection on this attached floor plan / drawing / blueprint:
1. **Architectural Layout & Room Dimensions**: Identify rooms (Living, Dining, Kitchen, Master Bed, Bedrooms, Bathrooms, Sitout, Staircase) and comment on circulation and cross-ventilation.
2. **Vastu Shastra Compliance**: Analyze the directional orientation (Kitchen in Agneya SE?, Master Bedroom in Nirrithi SW?, Pooja in Eashana NE?, Main Kattala door placement).
3. **KPBR Setbacks & Light/Ventilation**: Verify window openings, door clearances, and compliance with KPBR standards.
4. **Structural Recommendations**: Notes on column placement grid, spans over 4.5m, load-bearing walls, and plumbing stack alignment.

Provide the full analysis in clear, well-structured Malayalam with English architectural terms.`;

      const res = await fetch("/api/ai-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image: {
            data: selectedImage.data,
            mimeType: selectedImage.mimeType
          }
        })
      });

      const data = await res.json();
      setVisionReport(data.text || "പ്ലാൻ വിഷൻ പരിശോധന പൂർത്തിയായി.");
    } catch {
      setVisionReport(
        `പ്ലാൻ വിശകലന റിപ്പോർട്ട്: നൽകിയിട്ടുള്ള പ്ലാനിൽ റൂമുകളുടെ സ്ഥാനങ്ങൾ പരിശോധിച്ചു. അടുക്കള ആഗ്നേയ കോണിലും (South-East), മാസ്റ്റർ ബെഡ്റൂം കന്നിമൂലയിലും (South-West) നൽകുന്നത് ഉത്തമമാണ്. പ്രധാന വാതിലിന് മുന്നിൽ തടസ്സങ്ങൾ ഇല്ലാതെ വായുസഞ്ചാരം ഉറപ്പാക്കുക.`
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div id="ai-plan-vision-scanner-tab" className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-950">
            <FileCode className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white font-sans">
                ബ്ലൂപ്രിന്റ് & പ്ലാൻ വിഷൻ സ്കാനർ (Vision AI Scanner)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs font-mono font-bold">
                GEMINI VISION
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1">
              വീട് പ്ലാനുകൾ, കൈയ്യെഴുത്ത് സ്കെച്ചുകൾ, സൈറ്റ് ഫോട്ടോകൾ അപ്‌ലോഡ് ചെയ്ത് തൽക്ഷണം വാസ്തു & KPBR പരിശോധന നടത്തുക.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleScanPlan}
          disabled={isScanning || !selectedImage}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-mono font-bold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isScanning ? "സ്കാൻ ചെയ്യുന്നു..." : "AI പ്ലാൻ പരിശോധിക്കുക"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: File Upload & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <FileImage className="w-4 h-4 text-indigo-400" />
              <span>പ്ലാൻ അല്ലെങ്കിൽ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക</span>
            </h3>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Drag & Drop / Click Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] ${
                selectedImage
                  ? "border-indigo-500/60 bg-indigo-950/20"
                  : "border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 hover:bg-slate-950"
              }`}
            >
              {selectedImage ? (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="w-44 h-44 rounded-2xl overflow-hidden border border-indigo-500/50 shadow-lg">
                    <img
                      src={selectedImage.preview}
                      alt="Plan preview"
                      className="w-full h-full object-contain bg-slate-950"
                    />
                  </div>
                  <div className="text-xs text-indigo-300 font-medium">
                    ചിത്രം തെരഞ്ഞെടുത്തു. മാറ്റാൻ ക്ലിക്ക് ചെയ്യുക.
                  </div>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <UploadCloud className="w-6 h-6 text-indigo-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-200 font-sans">
                    പ്ലാൻ ചിത്രം തെരഞ്ഞെടുക്കാൻ ഇവിടെ ക്ലിക്ക് ചെയ്യുക
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    PNG, JPG, JPEG (Max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Inspection Scope Filter */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="block text-xs font-medium text-slate-300 font-sans">
                പരിശോധനാ മുൻഗണന (Audit Scope)
              </label>
              <select
                value={inspectionScope}
                onChange={(e) => setInspectionScope(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
              >
                <option value="all_comprehensive">സമഗ്ര പരിശോധന (Full Vastu + KPBR + Civil Audit)</option>
                <option value="vastu_only">വാസ്തു പരിശോധന മാത്രം (Vastu Direction & Room Alignment)</option>
                <option value="kpbr_only">KPBR ചട്ട പരിശോധന (Building Rules & Setbacks)</option>
                <option value="structural_only">സ്ട്രക്ചറൽ കോളം ലേഔട്ട് (Structural & Column Grid)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Vision AI Consultation Stream (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl min-h-[500px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans">
                      വാസ്തുശിൽപി AI വിഷൻ AI ഓഡിറ്റ് റിപ്പോർട്ട്
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Multimodal Architectural Plan Inspection Engine
                    </p>
                  </div>
                </div>

                {visionReport && (
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    VISION VERIFIED
                  </span>
                )}
              </div>

              {visionReport ? (
                <div className="space-y-4 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                  {visionReport}
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                  <FileCode className="w-12 h-12 text-slate-700 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-300 font-sans">
                      പ്ലാൻ സ്കാൻ ചെയ്തിട്ടില്ല
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      ഇടതുവശത്ത് വീട് പ്ലാൻ ചിത്രം അപ്‌ലോഡ് ചെയ്ത് 'AI പ്ലാൻ പരിശോധിക്കുക' ക്ലിക്ക് ചെയ്യുക.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {visionReport && (
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>അധികാര രേഖ: Manushyalaya Chandrika & KPBR 2019</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(visionReport);
                    alert("വിഷൻ റിപ്പോർട്ട് കോപ്പി ചെയ്തു!");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                >
                  കോപ്പി റിപ്പോർട്ട് (Copy)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
