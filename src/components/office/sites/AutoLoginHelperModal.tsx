import React, { useState } from "react";
import { ImportantSite } from "../../../types";
import { generateAutoLoginBookmarklet } from "../../../utils/importantSitesManager";
import {
  X,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  Bookmark,
  Sparkles,
  Zap,
  ShieldCheck,
  Code2,
  HelpCircle,
  MousePointerClick
} from "lucide-react";

interface AutoLoginHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: ImportantSite | null;
}

export const AutoLoginHelperModal: React.FC<AutoLoginHelperModalProps> = ({
  isOpen,
  onClose,
  site
}) => {
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeMethod, setActiveMethod] = useState<"bookmarklet" | "autocopy" | "userscript">("bookmarklet");

  if (!isOpen || !site) return null;

  const bookmarkletCode = generateAutoLoginBookmarklet(site.username, site.password);

  const userScriptCode = `// ==UserScript==
// @name         Vasthusilpy Auto-Fill for ${site.name}
// @namespace    https://vasthusilpy.com/
// @version      1.0
// @description  Auto-fills credentials for ${site.name}
// @match        ${site.url}*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    window.addEventListener('load', function() {
        setTimeout(function() {
            var u = "${site.username}";
            var p = "${site.password || ""}";
            var uField = document.querySelector('input[type="email"], input[name*="user" i], input[id*="user" i], input[type="text"]');
            var pField = document.querySelector('input[type="password"]');
            if (uField && u) { uField.value = u; uField.dispatchEvent(new Event('input', {bubbles: true})); }
            if (pField && p) { pField.value = p; pField.dispatchEvent(new Event('input', {bubbles: true})); }
        }, 600);
    });
})();`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2500);
  };

  const handleCopyUserScript = () => {
    navigator.clipboard.writeText(userScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-6 shadow-2xl my-8 relative text-xs font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-sans uppercase tracking-wide">
                Auto-Password Login Provisions
              </h3>
              <p className="text-xs text-cyan-400 font-mono">
                {site.name} • 1-Click Autofill
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

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveMethod("bookmarklet")}
            className={`py-2 px-3 rounded-xl font-mono font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMethod === "bookmarklet"
                ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>1-Click Bookmarklet</span>
          </button>

          <button
            onClick={() => setActiveMethod("autocopy")}
            className={`py-2 px-3 rounded-xl font-mono font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMethod === "autocopy"
                ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Auto-Copy</span>
          </button>

          <button
            onClick={() => setActiveMethod("userscript")}
            className={`py-2 px-3 rounded-xl font-mono font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMethod === "userscript"
                ? "bg-indigo-500 text-slate-950 font-black shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>UserScript / Extension</span>
          </button>
        </div>

        {/* METHOD 1: 1-Click Bookmarklet */}
        {activeMethod === "bookmarklet" && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-cyan-900/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold font-mono">
                <MousePointerClick className="w-4 h-4 text-cyan-400" />
                <span>Drag & Drop Bookmarklet to Your Bookmarks Bar</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Drag this blue button to your browser's Bookmarks bar (or click "Copy Code"). Whenever you open <strong>{site.name}</strong>, just click this bookmarklet to automatically fill your username and password into the login page!
              </p>

              {/* Draggable Bookmarklet Link */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <a
                  href={bookmarkletCode}
                  onClick={(e) => {
                    // Prevent normal link click
                    e.preventDefault();
                    handleCopyBookmarklet();
                  }}
                  className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl shadow-lg shadow-cyan-500/20 cursor-grab active:cursor-grabbing text-xs font-mono flex items-center gap-2 border border-cyan-400/40"
                  title="Drag this button to your browser bookmarks bar!"
                >
                  <Bookmark className="w-4 h-4 fill-slate-950" />
                  <span>Auto-Fill: {site.name}</span>
                </a>

                <button
                  onClick={handleCopyBookmarklet}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-mono text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {copiedBookmarklet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedBookmarklet ? "Copied JS Code!" : "Copy Bookmarklet Code"}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
              <h4 className="font-bold text-white font-mono text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>How to use the Bookmarklet in 3 simple steps:</span>
              </h4>
              <ol className="list-decimal list-inside text-slate-400 space-y-1.5 text-xs">
                <li>Make sure your browser Bookmarks Bar is visible (<span className="font-mono text-cyan-300">Ctrl + Shift + B</span> or <span className="font-mono text-cyan-300">Cmd + Shift + B</span>).</li>
                <li>Drag the cyan button above into your bookmarks bar.</li>
                <li>Open the login page of <strong>{site.name}</strong> and click the bookmarklet. It instantly populates your credentials!</li>
              </ol>
            </div>
          </div>
        )}

        {/* METHOD 2: Instant Auto-Copy */}
        {activeMethod === "autocopy" && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-emerald-900/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold font-mono">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Seamless 1-Click Launch with Automatic Password Clipboard</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                When you click the primary <strong>"Open Website & Auto-Copy Password"</strong> button on the site card:
              </p>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">1</div>
                  <div><strong>Opens Target Portal:</strong> Launches <span className="text-cyan-400 font-mono">{site.url}</span> in a dedicated new browser tab.</div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">2</div>
                  <div><strong>Auto-Copies Password:</strong> Securely writes your password to the system clipboard instantly.</div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">3</div>
                  <div><strong>Direct Paste:</strong> Just press <span className="font-mono text-emerald-400 font-bold">Ctrl+V</span> (or Command+V on Mac) in the password input on the website!</div>
                </div>
              </div>

              {/* Direct Open Button */}
              <div className="pt-2">
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (site.password) {
                      navigator.clipboard.writeText(site.password);
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open {site.name} & Auto-Copy Password Now</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* METHOD 3: UserScript / Extension */}
        {activeMethod === "userscript" && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-indigo-900/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-bold font-mono">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>Tampermonkey / Violentmonkey Auto-Fill Script</span>
                </div>
                <button
                  onClick={handleCopyUserScript}
                  className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 rounded-xl font-mono text-[11px] font-bold border border-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? "Script Copied!" : "Copy UserScript"}</span>
                </button>
              </div>

              <p className="text-slate-400 text-[11px]">
                If you use the <strong>Tampermonkey</strong> or <strong>Violentmonkey</strong> browser extension, paste this script to automatically fill credentials whenever the page loads.
              </p>

              <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[10px] text-indigo-200 overflow-x-auto max-h-48 select-all">
                {userScriptCode}
              </pre>
            </div>
          </div>
        )}

        {/* Quick Credentials Summary Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-500 uppercase">Username / ID</div>
            <div className="text-white font-bold">{site.username}</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-500 uppercase">Password Status</div>
            <div className="text-emerald-400 font-bold">{site.password ? "Saved & Protected" : "None"}</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-500 uppercase">URL</div>
            <div className="text-cyan-400 truncate max-w-xs">{site.url}</div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-mono font-bold text-xs cursor-pointer transition-colors"
          >
            Close Helper
          </button>
        </div>
      </div>
    </div>
  );
};
