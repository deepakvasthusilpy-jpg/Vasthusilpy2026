import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  CheckCircle2,
  X,
  Laptop,
  ShieldCheck,
  WifiOff,
  Zap,
  HardDrive,
  ExternalLink,
  Info
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isStandalone, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [installing, setInstalling] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const success = await install();
      if (success) {
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 p-0.5 shadow-lg flex items-center justify-center">
              <img src="/vasthusilpy_logo.svg" alt="Vasthusilpy" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  Install Vasthusilpy Software
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  OFFLINE READY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Run natively as a standalone desktop application on your PC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Key Advantages Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">100% Offline</div>
                <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Works without internet using local database
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Instant Launch</div>
                <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Zero load time from desktop icon & taskbar
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Secure Storage</div>
                <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Daily snapshots & automated backups
                </div>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('desktop')}
              className={`flex items-center gap-2 pb-2.5 px-4 font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'desktop'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Desktop (Windows / Mac / Linux)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mobile')}
              className={`flex items-center gap-2 pb-2.5 px-4 font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'mobile'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobile / Tablet (Android / iOS)</span>
            </button>
          </div>

          {/* Desktop Instructions */}
          {activeTab === 'desktop' && (
            <div className="space-y-3 font-sans text-xs text-slate-300">
              {isStandalone || isInstalled ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-300 text-sm">Application is Already Installed!</div>
                    <div className="text-slate-300 text-xs mt-0.5">
                      You are running Vasthusilpy Engineering Studio as a native desktop application. All offline features and local caches are fully operational.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-cyan-400" />
                      <span>Installation Steps for Chrome, Edge, Brave, Opera:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                      <li>
                        Click the <strong className="text-white">"Install Desktop App"</strong> button below.
                      </li>
                      <li>
                        Or click the <strong className="text-white">Install App icon (⊕ or 💻)</strong> in your browser's address bar at the top right.
                      </li>
                      <li>
                        Confirm <strong className="text-emerald-400">"Install"</strong> in the prompt.
                      </li>
                      <li>
                        A desktop shortcut and taskbar icon for <strong className="text-white">Vasthusilpy</strong> will be created automatically!
                      </li>
                    </ol>
                  </div>

                  {isInstallable && (
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      disabled={installing}
                      className="w-full py-3 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>{installing ? "Installing..." : "Install Desktop App Now (One-Click)"}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Mobile Instructions */}
          {activeTab === 'mobile' && (
            <div className="space-y-3 font-sans text-xs text-slate-300">
              {isIOS ? (
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-rose-400" />
                    <span>Install on iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                    <li>Open this website in <strong className="text-white">Safari</strong>.</li>
                    <li>Tap the <strong className="text-sky-400">Share button</strong> (box with upward arrow) at the bottom toolbar.</li>
                    <li>Scroll down and tap <strong className="text-emerald-400">"Add to Home Screen"</strong>.</li>
                    <li>Tap <strong className="text-white">"Add"</strong> at the top right.</li>
                  </ol>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Install on Android (Chrome / Firefox / Edge):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                    <li>Tap the <strong className="text-white">three dots menu (⋮)</strong> at top right.</li>
                    <li>Select <strong className="text-emerald-400">"Install app"</strong> or <strong className="text-emerald-400">"Add to Home screen"</strong>.</li>
                    <li>Confirm installation. The app will launch in standalone full-screen mode.</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PWA Standalone • Offline Capable</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition cursor-pointer font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
