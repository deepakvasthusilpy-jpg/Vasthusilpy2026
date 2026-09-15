import React, { useState } from "react";
import { ATTACHMENT_PAGES } from "../data/pdfPagesData";
import { THACHU_DATA } from "../data/thachuShastraData";
import { ThachuRow } from "../types";
import { FileText, ChevronLeft, ChevronRight, Eye, Table } from "lucide-react";

interface AttachmentTabProps {
  onSelectRow: (row: ThachuRow) => void;
}

export const AttachmentTab: React.FC<AttachmentTabProps> = ({ onSelectRow }) => {
  const [activePageNum, setActivePageNum] = useState<number>(1);

  const currentPageInfo = ATTACHMENT_PAGES.find((p) => p.pageNumber === activePageNum) || ATTACHMENT_PAGES[0];
  const pageRows = THACHU_DATA.filter((r) => r.page === activePageNum);

  return (
    <div className="space-y-6">
      {/* Top Title & Info */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm bg-blueprint-grid">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Full Attachment Document View (Original Blueprint)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
              തച്ചു ശാസ്ത്രം പട്ടിക - 17 പേജുകളുള്ള മൂലരേഖ
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              അറ്റാച്ച്മെന്റ് ഡോക്യുമെന്റിലെ ഓരോ പേജിലെയും ഡിജിറ്റൈസ് ചെയ്ത വരികളും വിവരങ്ങളും ഇവിടെ കാണാം.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-950 text-cyan-300 font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-700">
              17 PAGES / 268 ENTRIES
            </span>
          </div>
        </div>

        {/* Page Switcher Carousel Bar */}
        <div className="mt-4">
          <div className="text-xs font-mono font-bold text-slate-300 mb-2 flex items-center justify-between">
            <span>SELECT PAGE (1–17):</span>
            <span className="text-cyan-400 font-mono">{currentPageInfo.kolRange}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {ATTACHMENT_PAGES.map((page) => (
              <button
                key={page.pageNumber}
                onClick={() => setActivePageNum(page.pageNumber)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition shrink-0 cursor-pointer border ${
                  activePageNum === page.pageNumber
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                }`}
              >
                Page {page.pageNumber}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PAGE CONTENT DISPLAY */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Page Header */}
        <div className="bg-slate-950 text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800">
          <div>
            <div className="text-[11px] text-cyan-400 font-mono font-bold tracking-wider uppercase">
              ATTACHMENT PAGE {currentPageInfo.pageNumber} OF 17
            </div>
            <h3 className="text-lg md:text-xl font-bold font-mono text-white mt-0.5">
              {currentPageInfo.title}
            </h3>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Measurement Range: {currentPageInfo.kolRange} ({currentPageInfo.rowCount} rows)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={activePageNum === 1}
              onClick={() => setActivePageNum((p) => Math.max(1, p - 1))}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-cyan-300 transition cursor-pointer border border-slate-700"
              title="Previous Page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-cyan-300">
              {activePageNum} / 17
            </span>
            <button
              disabled={activePageNum === 17}
              onClick={() => setActivePageNum((p) => Math.min(17, p + 1))}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-cyan-300 transition cursor-pointer border border-slate-700"
              title="Next Page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page OCR Summary snippet */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
          <strong className="text-cyan-400 font-mono font-bold">പേജിലെ വിവരണം:</strong> {currentPageInfo.ocrSnippet}
        </div>

        {/* Page Table View formatted exactly like original attachment page */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-cyan-300 font-mono font-bold border-b border-slate-800 text-center uppercase tracking-wider">
                <th className="p-3 border-r border-slate-800">കോൽ</th>
                <th className="p-3 border-r border-slate-800">വിരൽ</th>
                <th className="p-3 border-r border-slate-800 bg-slate-900 text-cyan-400">ചുറ്റ് (CM)</th>
                <th className="p-3 border-r border-slate-800">യോനി</th>
                <th className="p-3 border-r border-slate-800">വ്യയം</th>
                <th className="p-3 border-r border-slate-800">ആയം കോൽ</th>
                <th className="p-3 border-r border-slate-800">ആയം വിരൽ</th>
                <th className="p-3 border-r border-slate-800 font-mono">ആയം CM</th>
                <th className="p-3 border-r border-slate-800">നക്ഷത്രം</th>
                <th className="p-3 border-r border-slate-800">നാഴിക</th>
                <th className="p-3 border-r border-slate-800">വയസ്സ്</th>
                <th className="p-3 border-r border-slate-800">തിഥി</th>
                <th className="p-3 border-r border-slate-800">നാഴിക</th>
                <th className="p-3 border-r border-slate-800">കരണം</th>
                <th className="p-3 border-r border-slate-800">ആഴ്ച</th>
                <th className="p-3 border-r border-slate-800">പക്ഷാന്തര</th>
                <th className="p-3 border-r border-slate-800">ഫലം</th>
                <th className="p-3">VIEW</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {pageRows.map((r) => {
                const rowClass =
                  r.phalam === "ഉത്തമം"
                    ? "bg-emerald-950/40 hover:bg-emerald-900/60 text-slate-100"
                    : r.phalam === "മധ്യമം"
                    ? "bg-cyan-950/40 hover:bg-cyan-900/60 text-slate-100"
                    : "bg-rose-950/40 hover:bg-rose-900/60 text-slate-100";

                return (
                  <tr
                    key={r.id}
                    className={`${rowClass} transition cursor-pointer text-center font-semibold`}
                    onClick={() => onSelectRow(r)}
                  >
                    <td className="p-3 border-r border-slate-800/80 text-white font-bold">{r.kol}</td>
                    <td className="p-3 border-r border-slate-800/80 text-white font-bold">{r.viral}</td>
                    <td className="p-3 border-r border-slate-800/80 font-mono font-bold text-cyan-300 bg-slate-950/60">
                      {r.chuttuCm}
                    </td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-200">{r.yoni}</td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-200">{r.vayam}</td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-300">{r.aayamKol}</td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-300">{r.aayamViral}</td>
                    <td className="p-3 border-r border-slate-800/80 font-mono text-cyan-300">{r.aayamCm}</td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-200 font-sans whitespace-nowrap">
                      {r.nakshatram}
                    </td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-300">{r.nakshatramNazhika}</td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-200 whitespace-nowrap">{r.vayassu}</td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-200 whitespace-nowrap">{r.pakshamTithi}</td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-300">{r.tithiNazhika}</td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-200 whitespace-nowrap">{r.karanam}</td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-200">{r.azhcha}</td>
                    <td className="p-3 border-r border-slate-800/80 text-slate-300">{r.pakshantharaVyayam}</td>
                    <td className="p-3 border-r border-slate-800/80 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold shadow-xs ${
                          r.phalam === "ഉത്തമം"
                            ? "bg-emerald-500 text-slate-950 border border-emerald-400"
                            : r.phalam === "മധ്യമം"
                            ? "bg-cyan-500 text-slate-950 border border-cyan-400"
                            : "bg-rose-500 text-slate-950 border border-rose-400"
                        }`}
                      >
                        {r.phalam}
                      </span>
                    </td>
                    <td className="p-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRow(r);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Page Footer Navigation */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
          <button
            disabled={activePageNum === 1}
            onClick={() => setActivePageNum((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4 text-cyan-400" />
            <span>PREV PAGE</span>
          </button>

          <span className="text-xs font-bold text-slate-400">
            PAGE {activePageNum} OF 17
          </span>

          <button
            disabled={activePageNum === 17}
            onClick={() => setActivePageNum((p) => Math.min(17, p + 1))}
            className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>NEXT PAGE</span>
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

