import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2, X } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setDismissed(false);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-mono font-bold text-white shadow-2xl border border-emerald-400 animate-slide-up">
        <Wifi className="w-4 h-4 text-white" />
        <span>Back Online — Local data ready to sync</span>
      </div>
    );
  }

  if (!isOnline && !dismissed) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-mono font-semibold text-amber-300 shadow-2xl border border-amber-500/50 backdrop-blur-md animate-slide-up">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Offline Workstation Active — Full local database operational</span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-0.5 rounded transition"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return null;
};
