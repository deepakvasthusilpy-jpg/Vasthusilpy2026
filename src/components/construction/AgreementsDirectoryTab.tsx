import React, { useState } from "react";
import { ConstructionAgreement, ConstructionSettings } from "../../types";
import { formatIndianCurrency, ConstructionStorageManager } from "../../utils/constructionStorageManager";
import { shareAgreementOnWhatsApp } from "../../utils/constructionShareManager";
import {
  FileText,
  Search,
  Printer,
  Edit3,
  Eye,
  Plus,
  Copy,
  QrCode,
  Archive,
  Trash2,
  Building,
  Calendar,
  Layers,
  ShieldCheck,
  Download,
  Share2,
  Sparkles,
  FileCheck2,
  Stamp
} from "lucide-react";

interface AgreementsDirectoryTabProps {
  agreements: ConstructionAgreement[];
  settings: ConstructionSettings;
  onAgreementUpdated: (agreement: ConstructionAgreement) => void;
  onAgreementDeleted: (agreementId: string) => void;
  onNavigateToNew: () => void;
  onEditAgreement: (agreement: ConstructionAgreement) => void;
  onPrintAgreement: (agreement: ConstructionAgreement, mode: "e_stamp" | "plain_a4") => void;
  onVerifyQr: (token: string) => void;
}

export const AgreementsDirectoryTab: React.FC<AgreementsDirectoryTabProps> = ({
  agreements,
  settings,
  onAgreementUpdated,
  onAgreementDeleted,
  onNavigateToNew,
  onEditAgreement,
  onPrintAgreement,
  onVerifyQr
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [agreementToDelete, setAgreementToDelete] = useState<ConstructionAgreement | null>(null);

  const filteredAgreements = agreements.filter(agr => {
    const matchesSearch =
      agr.client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agr.agreementNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agr.client.localBody.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agr.client.mobileNumber && agr.client.mobileNumber.includes(searchTerm));

    const matchesStatus = statusFilter === "ALL" || agr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDuplicate = async (agr: ConstructionAgreement) => {
    const nextNo = ConstructionStorageManager.generateNextAgreementNo();
    const token = ConstructionStorageManager.generateVerificationToken();
    const now = new Date().toISOString();

    const duplicated: ConstructionAgreement = {
      ...agr,
      id: nextNo,
      agreementNo: nextNo,
      title: `${agr.title} (പകർപ്പ്)`,
      status: "DRAFT",
      verificationToken: token,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    const saved = await ConstructionStorageManager.saveAgreement(duplicated);
    onAgreementUpdated(saved);
  };

  const confirmDelete = () => {
    if (agreementToDelete) {
      onAgreementDeleted(agreementToDelete.id);
      setAgreementToDelete(null);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
              LEGAL CONTRACTS & E-STAMP PORTAL
            </span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans mt-1">
            കെട്ടിട നിർമ്മാണ കരാറുകൾ (Agreements Vault)
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            MALAYALAM WORK CONTRACTS, 25-STAGE SCHEDULES, E-STAMP PRINTING & WHATSAPP SHARING
          </p>
        </div>

        <button
          onClick={onNavigateToNew}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-2xl shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ പുതിയ കരാർ ഉണ്ടാക്കുക (New Agreement)</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="കരാർ നമ്പർ, ക്ലയന്റ് പേര്, പഞ്ചായത്ത്, ഫോൺ നമ്പർ തിരയുക..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "GENERATED", "SIGNED", "APPROVED", "DRAFT", "ARCHIVED"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {st === "ALL" ? "എല്ലാം (ALL)" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Agreements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAgreements.length > 0 ? (
          filteredAgreements.map(agr => (
            <div
              key={agr.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header with Agreement No & Status */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                        {agr.agreementNo}
                      </span>
                      <span className="text-slate-400 font-mono text-xs">v{agr.version}</span>
                    </div>
                    <h3 className="font-bold text-white text-base mt-1">{agr.client.clientName}</h3>
                    <div className="text-xs text-slate-400 font-mono">
                      {agr.client.houseName} • {agr.client.localBody} ({agr.client.district})
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      📞 {agr.client.mobileNumber}
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold shrink-0 ${
                    agr.status === "SIGNED"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    {agr.status}
                  </span>
                </div>

                {/* Key Metrics Pill */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500">ആകെ വിസ്തീർണ്ണം</div>
                    <div className="text-xs font-bold text-white">{agr.totalBuiltUpArea.toLocaleString()} Sq.Ft</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">കരാർ തുക</div>
                    <div className="text-xs font-bold text-emerald-400">{formatIndianCurrency(agr.finalContractAmount)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">തീയതി</div>
                    <div className="text-xs font-bold text-indigo-300">{agr.agreementDate}</div>
                  </div>
                </div>

                {/* Stages and Extra Works count */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{agr.paymentSchedule.length} നിർമ്മാണ ഘട്ടങ്ങൾ</span>
                  </div>
                  {agr.extraWorks && agr.extraWorks.length > 0 ? (
                    <span className="text-amber-400 font-bold">+{agr.extraWorks.length} അധിക ജോലികൾ</span>
                  ) : (
                    <span className="text-slate-500">നിരക്ക്: ₹{agr.baseRatePerSqFt}/Sq.Ft</span>
                  )}
                </div>

                {/* Verification Token Info */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">ടോക്കൺ: {agr.verificationToken}</span>
                  </div>
                  <button
                    onClick={() => onVerifyQr(agr.verificationToken)}
                    className="text-emerald-400 hover:text-emerald-300 font-bold shrink-0 ml-2 cursor-pointer"
                  >
                    വെരിഫൈ QR
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS (Dedicated Separate Buttons for View, Edit, PDF, WhatsApp, Delete) */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                {/* Primary Row: View & Edit */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onPrintAgreement(agr, "plain_a4")}
                    className="py-2 px-3 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>കരാർ കാണുക (View)</span>
                  </button>
                  <button
                    onClick={() => onEditAgreement(agr)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-700 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>തിരുത്തുക (Edit / Modify)</span>
                  </button>
                </div>

                {/* Secondary Row: PDF Download & WhatsApp Share */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onPrintAgreement(agr, "plain_a4")}
                    className="py-2 px-3 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF ഡൗൺലോഡ്</span>
                  </button>
                  <button
                    onClick={() => shareAgreementOnWhatsApp(agr)}
                    className="py-2 px-3 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>വാട്സ്ആപ്പ് ഷെയർ</span>
                  </button>
                </div>

                {/* Tertiary Row: E-Stamp Print & Utility Actions (Duplicate & Delete) */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => onPrintAgreement(agr, "e_stamp")}
                    className="flex-1 py-1.5 px-3 bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Stamp className="w-3.5 h-3.5" />
                    <span>ഇ-സ്റ്റാമ്പ് പ്രിന്റ്</span>
                  </button>

                  <button
                    onClick={() => handleDuplicate(agr)}
                    title="ഡ്യൂപ്ലിക്കേറ്റ് കോപ്പി ഉണ്ടാക്കുക"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setAgreementToDelete(agr)}
                    title="കരാർ നീക്കം ചെയ്യുക"
                    className="p-2 bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300 rounded-xl transition cursor-pointer border border-slate-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-12 text-center text-slate-500 font-mono text-xs bg-slate-900 border border-slate-800 rounded-3xl">
            കരാറുകൾ ഒന്നും കണ്ടെത്തിയില്ല. "+ പുതിയ കരാർ ഉണ്ടാക്കുക" ക്ലിക്ക് ചെയ്യുക.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {agreementToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">കരാർ ഡിലീറ്റ് ചെയ്യണോ?</h3>
              <p className="text-xs text-slate-400 font-mono">
                കരാർ നമ്പർ <strong>{agreementToDelete.agreementNo}</strong> ({agreementToDelete.client.clientName}) ശാശ്വതമായി നീക്കം ചെയ്യപ്പെടും.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setAgreementToDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
              >
                റദ്ദാക്കുക (Cancel)
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer shadow-lg shadow-rose-950"
              >
                ഡിലീറ്റ് ചെയ്യുക (Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
