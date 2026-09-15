import React, { useState } from "react";
import { INITIAL_PRESETS_ENGINEERS } from "../../data/estimateData";
import { ShieldCheck, Check, Save, Stamp, Lock, AlertTriangle, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { canUseDigitalSignatures, AUTHORIZED_SIGNING_EMAILS } from "../../lib/firebase";

export const EngineerSealsTab: React.FC = () => {
  const { user, emailUser } = useAuth();
  const activeEmail = user?.email || emailUser?.email || "";
  const isAuthorizedSigner = canUseDigitalSignatures(activeEmail);

  const [presets, setPresets] = useState(INITIAL_PRESETS_ENGINEERS);
  const [selectedId, setSelectedId] = useState("dibin");

  const currentEng = presets.find((p) => p.id === selectedId) || presets[0];

  const [formData, setFormData] = useState({ ...currentEng });

  const handleSelectPreset = (id: string) => {
    setSelectedId(id);
    const eng = presets.find((p) => p.id === id);
    if (eng) {
      setFormData({ ...eng });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedSigner) {
      alert(
        `Digital signature and seal modifications are restricted to authorized accounts: ${AUTHORIZED_SIGNING_EMAILS.join(
          ", "
        )}. Currently logged in as: ${activeEmail || "Guest"}`
      );
      return;
    }
    setPresets((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...formData } : p))
    );
    alert(`Successfully saved and applied seal stamp settings for ${formData.fullName}!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800 uppercase inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ENGINEER AUTHORIZATION & RUBBER SEAL MANAGEMENT</span>
            </span>

            {isAuthorizedSigner ? (
              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/50 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Authorized Signer: {activeEmail}</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>View-Only Mode (Signing Restricted)</span>
              </span>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white font-sans uppercase">
            Engineer Profile & Stamp Seal
          </h2>
          <p className="text-xs text-slate-400 font-mono max-w-3xl">
            Configure engineer registration details, designation, phone numbers, and official rubber seal stamp. These details automatically populate across all A4 Detailed Rate Estimate Sheets and verification portals.
          </p>
        </div>

        {/* Security / Authorization Notice */}
        {!isAuthorizedSigner && (
          <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3.5 flex items-start gap-3 text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold uppercase font-mono tracking-wide text-amber-300">
                Digital Signatures & Official Seals Restricted
              </div>
              <p className="text-[11px] text-amber-200/90 font-mono">
                Official digital signatures, seal configuration, and certificate signing options are exclusively available to verified engineer logins (
                <strong className="text-amber-100 font-bold">deepak.vasthusilpy@gmail.com</strong> & <strong className="text-amber-100 font-bold">dibindeepak1@gmail.com</strong>
                ). You are currently logged in as <span className="underline font-bold">{activeEmail || "Guest / Unauthenticated"}</span>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Select Presets Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <span>Select Presets or Custom Engineer Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((eng) => {
            const isSelected = eng.id === selectedId;
            return (
              <div
                key={eng.id}
                onClick={() => handleSelectPreset(eng.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isSelected
                    ? "bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-white">{eng.fullName}</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                      {eng.designation}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">Reg: {eng.regNo}</div>
                  <div className="text-[11px] text-slate-500">{eng.houseAddress}, {eng.districtPincode}</div>
                  <div className="text-[10px] font-mono text-slate-400">Mob: {eng.phones}</div>
                </div>

                {/* Stamp Seal Card Visual */}
                <div className="border border-indigo-700/60 bg-indigo-950/30 rounded-lg p-2.5 text-center text-[9px] font-mono text-indigo-200 shrink-0 w-44 leading-tight shadow-inner">
                  <div className="font-bold border-b border-indigo-800 pb-0.5 mb-1 text-indigo-100 uppercase">
                    {eng.fullName}
                  </div>
                  <div className="text-[8px] text-slate-300 truncate">{eng.houseAddress}</div>
                  <div className="text-[8px] text-slate-400">{eng.districtPincode}</div>
                  <div className="font-bold text-[8px] text-indigo-300 my-0.5 uppercase bg-indigo-900/60 py-0.5">
                    {eng.designation}
                  </div>
                  <div className="text-[8px] text-indigo-400 font-bold">Reg No: {eng.regNo}</div>
                  <div className="text-[8px] text-slate-400 truncate">Mob: {eng.phones}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Form & Live Stamp Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            EDIT ENGINEER INFORMATION
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Engineer Full Name *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Designation / Classification *</label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Registration Number (Reg No.) *</label>
              <input
                type="text"
                required
                value={formData.regNo}
                onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Department / Authority</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-sans focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">House Name / Office Address</label>
              <input
                type="text"
                value={formData.houseAddress}
                onChange={(e) => setFormData({ ...formData, houseAddress: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-sans focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">District & Pincode</label>
              <input
                type="text"
                value={formData.districtPincode}
                onChange={(e) => setFormData({ ...formData, districtPincode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-sans focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Mobile Contact Number(s)</label>
              <input
                type="text"
                value={formData.phones}
                onChange={(e) => setFormData({ ...formData, phones: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={!isAuthorizedSigner}
              className={`px-6 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md ${
                isAuthorizedSigner
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
              }`}
              title={
                isAuthorizedSigner
                  ? "Save & apply seal settings"
                  : "Official digital signatures & seals restricted to deepak.vasthusilpy@gmail.com & dibindeepak1@gmail.com"
              }
            >
              {isAuthorizedSigner ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Apply Engineer Seal</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Signing Locked (Authorized Admins Only)</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Preview Column */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            LIVE SEAL STAMP PREVIEW ON DOCUMENT
          </h4>

          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 w-full max-w-[280px]">
            <div className="border-2 border-indigo-700 bg-indigo-50/40 rounded-lg p-4 text-center text-xs font-mono text-indigo-950 leading-tight space-y-1">
              <div className="font-black text-sm uppercase tracking-wide border-b border-indigo-200 pb-1 mb-1">
                {formData.fullName || "ENGINEER NAME"}
              </div>
              <div className="text-[11px] text-indigo-800">{formData.houseAddress || "Address"}</div>
              <div className="text-[11px] text-indigo-800">{formData.districtPincode || "District"}</div>
              <div className="font-bold text-[11px] text-indigo-900 my-1 uppercase bg-indigo-100 py-0.5 rounded">
                {formData.designation || "DESIGNATION"}
              </div>
              <div className="text-[10px] text-indigo-700 font-bold">
                Reg No: {formData.regNo || "REGISTRATION NO"}
              </div>
              <div className="text-[10px] text-indigo-600">{formData.department}</div>
              <div className="text-[10px] text-indigo-600">Mob: {formData.phones}</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-mono leading-relaxed max-w-xs">
            This rubber stamp seal will render on the bottom authorization section of A4 Estimate Sheets and Document Verification exports.
          </p>
        </div>
      </div>
    </div>
  );
};
