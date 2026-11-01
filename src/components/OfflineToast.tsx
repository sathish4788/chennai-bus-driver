import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineToast: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 border border-amber-300 text-slate-950 px-3.5 py-2 text-xs font-bold shadow-2xl animate-bounce">
      <WifiOff className="w-4 h-4 text-slate-950" />
      <span>Offline Mode — Cached 3D game data is active.</span>
    </div>
  );
};
