import React, { useState } from 'react';
import { Fuel, X, CheckCircle } from 'lucide-react';
import { sound } from '../systems/audio';

interface PetrolBunkModalProps {
  currentFuel: number;
  maxFuel: number;
  playerMoney: number;
  onRefuel: (litres: number, cost: number) => void;
  onClose: () => void;
}

export const PetrolBunkModal: React.FC<PetrolBunkModalProps> = ({
  currentFuel,
  maxFuel,
  playerMoney,
  onRefuel,
  onClose,
}) => {
  const [refuelMessage, setRefuelMessage] = useState<string | null>(null);
  const pricePerLitre = 94; // ₹94 per litre
  const neededLitres = Math.round(maxFuel - currentFuel);

  const handleRefuel = (litres: number) => {
    const actualLitres = Math.min(litres, neededLitres);
    const cost = actualLitres * pricePerLitre;

    if (actualLitres <= 0) {
      setRefuelMessage('Your diesel tank is already full!');
      return;
    }

    if (playerMoney < cost) {
      setRefuelMessage(`Insufficient balance! Need ₹${cost.toLocaleString()}`);
      return;
    }

    sound.playRefuelSound();
    onRefuel(actualLitres, cost);
    setRefuelMessage(`Successfully added ${actualLitres}L of diesel for ₹${cost.toLocaleString()}!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-yellow-400/80 rounded-3xl p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">HIGHWAY DIESEL BUNK</h3>
              <p className="text-xs text-slate-400 font-sans">தமிழ்நாடு நெடுஞ்சாலை எரிபொருள்</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Fuel Gauge */}
        <div className="my-5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-slate-400 font-bold">CURRENT DIESEL LEVEL:</span>
            <span className="text-emerald-400 font-black text-sm">
              {Math.round(currentFuel)} / {Math.round(maxFuel)} Litres
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (currentFuel / maxFuel) * 100)}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between items-center text-xs text-slate-400">
            <span>Rate: ₹{pricePerLitre}/Litre</span>
            <span className="font-mono text-amber-300 font-bold">
              Your Wallet: ₹{playerMoney.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Success/Error Feedback */}
        {refuelMessage && (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-center text-emerald-400 flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>{refuelMessage}</span>
          </div>
        )}

        {/* Refuel Actions */}
        <div className="space-y-2.5">
          <button
            onClick={() => handleRefuel(15)}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition flex justify-between items-center border border-slate-700"
          >
            <span className="font-bold text-sm">Add 15 Litres</span>
            <span className="font-mono font-black text-amber-400">₹{(15 * pricePerLitre).toLocaleString()}</span>
          </button>

          <button
            onClick={() => handleRefuel(30)}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition flex justify-between items-center border border-slate-700"
          >
            <span className="font-bold text-sm">Add 30 Litres</span>
            <span className="font-mono font-black text-amber-400">₹{(30 * pricePerLitre).toLocaleString()}</span>
          </button>

          <button
            onClick={() => handleRefuel(neededLitres)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white active:scale-95 transition flex justify-between items-center shadow-lg font-black"
          >
            <span>Fill Tank to Max ({neededLitres}L)</span>
            <span className="font-mono font-black text-yellow-300">
              ₹{(neededLitres * pricePerLitre).toLocaleString()}
            </span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
        >
          RESUME HIGHWAY JOURNEY
        </button>
      </div>
    </div>
  );
};
