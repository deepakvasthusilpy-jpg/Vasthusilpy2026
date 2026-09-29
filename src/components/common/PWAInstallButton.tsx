import React, { useState } from 'react';
import { Download, Monitor, CheckCircle2, Laptop } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '', compact = false }) => {
  const { isInstallable, isInstalled, isStandalone, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // If running in standalone mode (already installed as desktop software)
  if (isStandalone) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 rounded-full text-emerald-300 text-[11px] font-mono font-bold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">DESKTOP APP</span>
        <span className="sm:hidden">APP</span>
      </div>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <button
        id="btn-install-desktop-app"
        type="button"
        onClick={handleClick}
        title="Install Vasthusilpy as a native Desktop / Mobile software (works 100% offline)"
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-red-500/50 hover:border-red-400 bg-red-950/70 hover:bg-red-900/80 text-red-200 hover:text-white text-xs font-mono font-bold transition-all shadow-sm cursor-pointer backdrop-blur-md active:scale-95 ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-red-300 animate-bounce" />
        {compact ? (
          <span className="uppercase text-[10px] font-black tracking-wider">INSTALL</span>
        ) : (
          <>
            <span className="uppercase text-[11px] font-black tracking-wider hidden sm:inline">
              INSTALL APP
            </span>
            <span className="uppercase text-[10px] font-black tracking-wider sm:hidden">
              INSTALL
            </span>
          </>
        )}
      </button>

      <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
