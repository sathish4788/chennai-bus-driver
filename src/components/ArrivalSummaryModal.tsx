import React from 'react';
import { RouteInfo, BusModelConfig, DrivingRating } from '../types/game';
import { Trophy, CheckCircle, ArrowRight, Star } from 'lucide-react';

interface ArrivalSummaryModalProps {
  route: RouteInfo;
  bus: BusModelConfig;
  passengers: number;
  fareCollected: number;
  onTimeBonus: number;
  speedingFines: number;
  fuelCost: number;
  repairCost: number;
  latePenalty: number;
  finalProfit: number;
  rating: DrivingRating;
  onContinue: () => void;
}

export const ArrivalSummaryModal: React.FC<ArrivalSummaryModalProps> = ({
  route,
  bus,
  passengers,
  fareCollected,
  onTimeBonus,
  speedingFines,
  fuelCost,
  repairCost,
  latePenalty,
  finalProfit,
  rating,
  onContinue,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 shadow-2xl text-white flex flex-col max-h-[95vh] overflow-y-auto">
        {/* Header Celebration */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-3 shadow-xl shadow-emerald-950/50 flex items-center justify-center mb-3">
            <Trophy className="w-10 h-10 text-slate-950" />
          </div>

          <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            JOURNEY COMPLETED SUCCESSFULLY
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
            ARRIVED AT {route.destination.toUpperCase()}
          </h2>
          <p className="text-sm font-semibold text-emerald-400 font-sans">
            {route.tamilDestination} புதிய பேருந்து நிலையம்
          </p>
        </div>

        {/* Rating Banner */}
        <div className="mt-5 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">DRIVING PERFORMANCE:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-sm font-black px-3 py-1 rounded-xl uppercase ${
                rating === 'Excellent'
                  ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500'
                  : rating === 'Good'
                  ? 'bg-blue-900/80 text-blue-300 border border-blue-500'
                  : 'bg-amber-900/80 text-amber-300 border border-amber-500'
              }`}
            >
              {rating} Driving
            </span>
            <div className="flex text-amber-400 ml-1">
              {Array.from({ length: rating === 'Excellent' ? 3 : rating === 'Good' ? 2 : 1 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="mt-5 bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between items-center text-slate-300">
            <span>Passengers Transported:</span>
            <span className="font-mono font-bold text-white">{passengers} / 40 pax</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Route Distance Travelled:</span>
            <span className="font-mono font-bold text-white">{route.distanceKm} km</span>
          </div>

          <div className="h-px bg-slate-800 my-1" />

          {/* Fare Income */}
          <div className="flex justify-between items-center">
            <span className="text-emerald-400 font-bold">Passenger Fares Collected:</span>
            <span className="font-mono font-black text-emerald-400 text-sm">
              +₹{fareCollected.toLocaleString()}
            </span>
          </div>

          {/* On-Time Bonus */}
          {onTimeBonus > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-emerald-400 font-bold">Punctuality On-Time Bonus:</span>
              <span className="font-mono font-black text-emerald-400">
                +₹{onTimeBonus.toLocaleString()}
              </span>
            </div>
          )}

          {/* Late Penalty */}
          {latePenalty > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-red-400 font-bold">Late Arrival Penalty:</span>
              <span className="font-mono font-black text-red-400">
                -₹{latePenalty.toLocaleString()}
              </span>
            </div>
          )}

          {/* Speeding Fines */}
          {speedingFines > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-red-400 font-bold">Speeding Fines (Police radar):</span>
              <span className="font-mono font-black text-red-400">
                -₹{speedingFines.toLocaleString()}
              </span>
            </div>
          )}

          {/* Fuel Expenses */}
          {fuelCost > 0 && (
            <div className="flex justify-between items-center text-slate-400">
              <span>Diesel Refuelling Expenses:</span>
              <span className="font-mono font-bold text-slate-300">
                -₹{fuelCost.toLocaleString()}
              </span>
            </div>
          )}

          {/* Repair Expenses */}
          {repairCost > 0 && (
            <div className="flex justify-between items-center text-slate-400">
              <span>Tyre Puncture Repair Expenses:</span>
              <span className="font-mono font-bold text-slate-300">
                -₹{repairCost.toLocaleString()}
              </span>
            </div>
          )}

          <div className="h-px bg-slate-700 my-2" />

          {/* FINAL NET PROFIT */}
          <div className="flex justify-between items-center pt-1 text-base sm:text-lg">
            <span className="font-black text-white">FINAL NET PROFIT:</span>
            <span className="font-mono font-black text-xl sm:text-2xl text-amber-400">
              ₹{finalProfit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onContinue}
          className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl active:scale-95 transition flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          <span>CLAIM EARNINGS & CONTINUE</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
