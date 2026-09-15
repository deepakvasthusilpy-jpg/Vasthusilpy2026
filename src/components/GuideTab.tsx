import React from "react";
import { BookOpen, Compass, Ruler, HelpCircle } from "lucide-react";

export const GuideTab: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro Banner */}
      <div className="bg-slate-900/90 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-800 backdrop-blur-sm bg-blueprint-grid text-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-7 h-7 text-cyan-400" />
          <h2 className="text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">
            തച്ചു ശാസ്ത്ര തത്ത്വങ്ങളും വക കണക്കുകളും (Thachu Shastra Technical Manual)
          </h2>
        </div>
        <p className="text-slate-300 font-sans text-sm md:text-base leading-relaxed mt-2">
          പരമ്പരാഗത കേരളീയ ഗൃഹനിർമ്മാണത്തിൽ വാസ്തുപുരുഷ മണ്ഡലവും കോൽ-വിരൽ അളവുകളും ഉപയോഗിച്ച് വീട്, കെട്ടിടങ്ങൾ, കട്ടള, വാതിൽ, മുറികൾ എന്നിവയുടെ ദീർഘ-വീതികൾ കണക്കാക്കുന്ന തത്ത്വങ്ങൾ.
        </p>
      </div>

      {/* Units Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
            <Ruler className="w-5 h-5 text-cyan-400" />
            <span>അളവുമാനങ്ങൾ (Measurement Standards)</span>
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-300 font-mono leading-relaxed">
            <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-cyan-400 font-bold shrink-0">• 1 കോൽ (1 Kol):</strong>
              <span>24 വിരൽ = 72 സെൻ്റിമീറ്റർ = 2.3622 ഫീറ്റ്</span>
            </li>
            <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-cyan-400 font-bold shrink-0">• 1 വിരൽ (1 Viral):</strong>
              <span>3 സെൻ്റിമീറ്റർ = 1.181 ഇഞ്ച്</span>
            </li>
            <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-cyan-400 font-bold shrink-0">• ചുറ്റ് (Perimeter):</strong>
              <span>കെട്ടിടത്തിന്റെയോ മുറിയുടെയോ ആകെ വശങ്ങളുടെ തുക. ചുറ്റ് = (കോൽ × 24 + വിരൽ) × 3 cm.</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
            <Compass className="w-5 h-5 text-cyan-400" />
            <span>യോനികൾ (The 8 Yonis)</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            ചുറ്റിനെ 8 കൊണ്ടു ഹരിച്ച ശിഷ്ടമാണ് യോനി (Yoni Index):
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-emerald-950/60 text-emerald-300 p-2.5 rounded-lg border border-emerald-800">
              <strong>1. ധ്വജം (East):</strong> ഉത്തമം - സമ്പത്ത്, വളർച്ച
            </div>
            <div className="bg-slate-950 text-slate-300 p-2.5 rounded-lg border border-slate-800">
              <strong>3. സിംഹം (South):</strong> ഉത്തമം - പ്രതാപം, വിജയം
            </div>
            <div className="bg-emerald-950/60 text-emerald-300 p-2.5 rounded-lg border border-emerald-800">
              <strong>5. വൃഷഭം (West):</strong> ഉത്തമം - സുഖം, സന്തോഷം
            </div>
            <div className="bg-slate-950 text-slate-300 p-2.5 rounded-lg border border-slate-800">
              <strong>7. ഗജം (North):</strong> ഉത്തമം - ലക്ഷ്മീദേവി കൃപ
            </div>
          </div>
        </div>
      </div>

      {/* Param List Guide */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <span>പട്ടികയിലെ 17 ഘടകങ്ങൾ (17 Vastu Parameters)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-cyan-400 font-mono font-bold block mb-1">1. ആയം (Income):</strong>
            <span className="text-slate-300">ലാഭവും വരുമാനവും സൂചിപ്പിക്കുന്നു. ചുറ്റിനെ 8 കൊണ്ടു പെരുക്കി 12 കൊണ്ടു ഹരിച്ചാൽ കിട്ടുന്നത്.</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-cyan-400 font-mono font-bold block mb-1">2. വ്യയം (Expenditure):</strong>
            <span className="text-slate-300">ചെലവും നഷ്ടവും സൂചിപ്പിക്കുന്നു. ആയം എപ്പോഴും വ്യയത്തേക്കാൾ കൂടുതലായിരിക്കണം.</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-cyan-400 font-mono font-bold block mb-1">3. വയസ്സ് (Age Category):</strong>
            <span className="text-slate-300">ബാല്യം, കൗമാരം, യൗവ്വനം എന്നിവ ശുഭപ്രദമാണ്. വാർദ്ധക്യം മധ്യമവും മരണം അധമവുമാണ്.</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-cyan-400 font-mono font-bold block mb-1">4. ഗുണ ദോഷ ഫലം (Phalam):</strong>
            <span className="text-slate-300">
              <strong className="text-emerald-400">ഉത്തമം (Good)</strong>,{" "}
              <strong className="text-cyan-400">മധ്യമം (Average)</strong>,{" "}
              <strong className="text-rose-400">അധമം (Inauspicious)</strong> എന്നിങ്ങനെ തരംതിരിച്ചിരിക്കുന്നു.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

