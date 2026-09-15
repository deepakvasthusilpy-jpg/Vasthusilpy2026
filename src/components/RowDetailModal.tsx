import React from "react";
import { ThachuRow } from "../types";
import { X, CheckCircle2, AlertTriangle, Info, Copy, Check } from "lucide-react";

interface RowDetailModalProps {
  row: ThachuRow | null;
  onClose: () => void;
}

export const RowDetailModal: React.FC<RowDetailModalProps> = ({ row, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!row) return null;

  const handleCopy = () => {
    const text = `തച്ചു ശാസ്ത്ര വിവരങ്ങൾ:
കോൽ: ${row.kol}, വിരൽ: ${row.viral}
ചുറ്റ്: ${row.chuttuCm} cm (${row.chuttuFeetInches})
യോനി: ${row.yoniName}
വ്യയം: ${row.vayam}
ആയം: ${row.aayamKol} കോൽ ${row.aayamViral} വിരൽ (${row.aayamCm} cm)
നക്ഷത്രം: ${row.nakshatram} (${row.nakshatramNazhika} നാഴിക)
വയസ്സ്: ${row.vayassu}
തിഥി: ${row.pakshamTithi} (${row.tithiNazhika} നാഴിക)
കരണം: ${row.karanam}
ആഴ്ച: ${row.azhchaFullName}
ഫലം: ${row.phalam} (പേജ് ${row.page})`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div
          className={`p-5 flex items-center justify-between text-slate-950 font-mono ${
            row.phalam === "ഉത്തമം"
              ? "bg-emerald-500"
              : row.phalam === "മധ്യമം"
              ? "bg-cyan-500"
              : "bg-rose-500"
          }`}
        >
          <div className="flex items-center gap-3">
            {row.phalam === "ഉത്തമം" && <CheckCircle2 className="w-7 h-7 text-slate-950" />}
            {row.phalam === "മധ്യമം" && <Info className="w-7 h-7 text-slate-950" />}
            {row.phalam === "അധമം" && <AlertTriangle className="w-7 h-7 text-slate-950" />}
            <div>
              <div className="text-xs uppercase font-bold text-slate-900 tracking-wider">
                TECHNICAL SPECIFICATION #{row.id}
              </div>
              <h3 className="text-xl font-bold font-mono">
                കോൽ {row.kol} വിരൽ {row.viral} — {row.phalam}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-950/20 rounded-lg text-slate-950 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">KOL & VIRAL</span>
              <strong className="text-sm font-bold text-white">
                {row.kol} കോൽ {row.viral} വിരൽ
              </strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-cyan-800 col-span-2">
              <span className="text-cyan-400 block text-[11px]">CHUTTU (PERIMETER)</span>
              <strong className="text-sm font-bold text-cyan-300">
                {row.chuttuCm} cm ({row.chuttuFeetInches})
              </strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">YONI</span>
              <strong className="text-sm font-bold text-slate-200">{row.yoniName}</strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">VYAYAM</span>
              <strong className="text-sm font-bold text-slate-200">{row.vayam}</strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">AAYAM</span>
              <strong className="text-sm font-bold text-slate-200">
                {row.aayamKol} കോൽ {row.aayamViral} വിരൽ ({row.aayamCm} cm)
              </strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">NAKSHATRAM</span>
              <strong className="text-sm font-bold text-slate-200">
                {row.nakshatram} ({row.nakshatramNazhika} നാഴിക)
              </strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">AGE (VAYASSU)</span>
              <strong className="text-sm font-bold text-slate-200">{row.vayassu}</strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">TITHI</span>
              <strong className="text-sm font-bold text-slate-200">
                {row.pakshamTithi} ({row.tithiNazhika} നാഴിക)
              </strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">KARANAM</span>
              <strong className="text-sm font-bold text-slate-200">{row.karanam}</strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">DAY / PLANET</span>
              <strong className="text-sm font-bold text-slate-200">{row.azhchaFullName}</strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">PAKSHANTHARA VYAYAM</span>
              <strong className="text-sm font-bold text-slate-200">{row.pakshantharaVyayam}</strong>
            </div>
          </div>

          <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between font-mono">
            <span>Attachment Document Page: Page {row.page}</span>
            <span>Record ID #{row.id}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3 font-mono">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? "COPIED TO CLIPBOARD" : "COPY DETAILS"}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
