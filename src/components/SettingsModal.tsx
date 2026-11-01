import React, { useState } from 'react';
import { PlayerProfile } from '../types/game';
import { X, Volume2, Download, Trash2, Keyboard, CheckCircle, Info } from 'lucide-react';
import { sound } from '../systems/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SettingsModalProps {
  profile: PlayerProfile;
  onUpdateVolume: (volumes: PlayerProfile['soundVolume']) => void;
  onResetData: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  onUpdateVolume,
  onResetData,
  onClose,
}) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [volumes, setVolumes] = useState(profile.soundVolume);

  const handleVolumeChange = (key: keyof PlayerProfile['soundVolume'], val: number) => {
    const updated = { ...volumes, [key]: val };
    setVolumes(updated);
    sound.setVolumes(updated.master, updated.engine, updated.horn, updated.ambience);
    onUpdateVolume(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl text-white flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black tracking-tight">GAME SETTINGS</h2>
            <p className="text-xs text-slate-400">Audio preferences, controls, PWA installation & save data.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Audio Volumes */}
        <div className="mt-5 space-y-4">
          <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>SOUND & VOLUME CONTROLS</span>
          </h3>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-300">Master Volume</span>
                <span className="font-mono text-emerald-400">{Math.round(volumes.master * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volumes.master}
                onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-300">Bus Diesel Engine</span>
                <span className="font-mono text-emerald-400">{Math.round(volumes.engine * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volumes.engine}
                onChange={(e) => handleVolumeChange('engine', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-300">Indian Bus Air Horn</span>
                <span className="font-mono text-amber-400">{Math.round(volumes.horn * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volumes.horn}
                onChange={(e) => handleVolumeChange('horn', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-300">Highway & Coastal Ambience</span>
                <span className="font-mono text-sky-400">{Math.round(volumes.ambience * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volumes.ambience}
                onChange={(e) => handleVolumeChange('ambience', parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 2. PWA App Installation Option */}
        <div className="mt-5 space-y-2">
          <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Download className="w-4 h-4 text-amber-400" />
            <span>PROGRESSIVE WEB APP (PWA)</span>
          </h3>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-white">Install on Device</div>
              <div className="text-xs text-slate-400">
                Play offline, landscape full-screen without browser bars.
              </div>
            </div>

            {isInstalled ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-700">
                <CheckCircle className="w-4 h-4" />
                <span>Installed</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
              >
                INSTALL APP
              </button>
            ) : isIOS ? (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs transition"
              >
                iOS Instructions
              </button>
            ) : (
              <div className="text-xs text-slate-500 font-medium">
                PWA Ready (Menu ➔ Install)
              </div>
            )}
          </div>
        </div>

        {/* 3. Controls Reference Guide */}
        <div className="mt-5 space-y-2">
          <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-sky-400" />
            <span>DRIVING CONTROLS REFERENCE</span>
          </h3>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono grid grid-cols-2 gap-2 text-slate-300">
            <div><span className="text-amber-400 font-bold">W / UP</span> : Accelerate</div>
            <div><span className="text-amber-400 font-bold">S / DOWN</span> : Brake</div>
            <div><span className="text-amber-400 font-bold">A / LEFT</span> : Steer Left</div>
            <div><span className="text-amber-400 font-bold">D / RIGHT</span> : Steer Right</div>
            <div><span className="text-amber-400 font-bold">SPACE</span> : Emergency Brake</div>
            <div><span className="text-amber-400 font-bold">C</span> : Switch Camera</div>
            <div><span className="text-amber-400 font-bold">H</span> : Indian Musical Horn</div>
            <div><span className="text-amber-400 font-bold">L</span> : Toggle Headlights</div>
          </div>
        </div>

        {/* 4. Reset Data Section */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-300">Reset Game Progress</div>
            <div className="text-[11px] text-slate-500">Erases saved money and unlocked buses.</div>
          </div>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 text-xs font-bold transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onResetData();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition"
              >
                CONFIRM RESET
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* iOS Guide Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-white">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Info className="w-5 h-5" />
                <h4 className="font-black text-base">Install on iPhone or iPad</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                1. Open this game in Safari.<br />
                2. Tap the <strong>Share</strong> icon (box with upward arrow).<br />
                3. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                4. Tap <strong>Add</strong> in the top-right corner.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs"
              >
                Close Instructions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
