import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle } from 'lucide-react';
import { sound } from '../systems/audio';

interface PunctureModalProps {
  playerMoney: number;
  onRepairComplete: (cost: number) => void;
  onClose: () => void;
}

export const PunctureModal: React.FC<PunctureModalProps> = ({
  playerMoney,
  onRepairComplete,
  onClose,
}) => {
  const repairCost = 500;
  const [isRepairing, setIsRepairing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let timer: number;
    if (isRepairing && progress < 100) {
      timer = window.setTimeout(() => {
        setProgress((prev) => {
          const next = prev + 25;
          if (next >= 100) {
            setIsFinished(true);
            setIsRepairing(false);
            sound.playCashChime();
            onRepairComplete(repairCost);
            return 100;
          }
          return next;
        });
      }, 700);
    }
    return () => clearTimeout(timer);
  }, [isRepairing, progress, onRepairComplete]);

  const startRepair = () => {
    setIsRepairing(true);
    setProgress(5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
            <Wrench className={`w-6 h-6 ${isRepairing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white">
              ROADSIDE TYRE PUNCTURE REPAIR
            </h3>
            <p className="text-xs text-amber-400 font-sans">
              டயர் பஞ்சர் பழுது நீக்குதல்
            </p>
          </div>
        </div>

        {/* Status description */}
        <div className="my-4 text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
          A sharp road nail punctured the bus tyre. The highway roadside puncture mechanic has arrived with jack and air compressor.
        </div>

        {/* Repair details */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-400">REPAIR COST:</span>
            <div className="text-base font-black font-mono text-amber-400">
              ₹{repairCost}
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-400">ESTIMATED REPAIR TIME:</span>
            <div className="text-sm font-bold text-white">
              ~3 in-game mins
            </div>
          </div>
        </div>

        {/* Progress Bar when repairing */}
        {isRepairing && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Mechanic Replacing Tube & Inflating...</span>
              <span className="text-amber-400 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Finished notice */}
        {isFinished && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Tyre repaired successfully! Normal highway speed restored.</span>
          </div>
        )}

        {/* Action button */}
        <div className="mt-6">
          {!isRepairing && !isFinished && (
            <button
              onClick={startRepair}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg active:scale-95"
            >
              PAY ₹{repairCost} & COMMENCE REPAIR
            </button>
          )}

          {isFinished && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition shadow-lg active:scale-95"
            >
              RESUME JOURNEY 🚌
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
