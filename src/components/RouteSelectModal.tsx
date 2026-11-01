import React from 'react';
import { RouteInfo, TAMIL_NADU_ROUTES } from '../types/game';
import { X, Check, Lock, Navigation, Sparkles } from 'lucide-react';

interface RouteSelectModalProps {
  unlockedRouteIds: string[];
  selectedRouteId: string;
  onSelectRoute: (route: RouteInfo) => void;
  onClose: () => void;
}

export const RouteSelectModal: React.FC<RouteSelectModalProps> = ({
  unlockedRouteIds,
  selectedRouteId,
  onSelectRoute,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <Navigation className="w-6 h-6 text-emerald-400" />
              <span>SELECT DESTINATION</span>
              <span className="text-amber-400 text-sm font-bold font-sans">
                தமிழ்நாடு வழித்தடங்கள்
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Depart from Chennai CMBT and transport 40 passengers safely across Tamil Nadu highways.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Routes Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {TAMIL_NADU_ROUTES.map((route, idx) => {
            const isUnlocked = unlockedRouteIds.includes(route.id);
            const isSelected = selectedRouteId === route.id;
            const expectedEarnings = route.farePerPassenger * 40;

            return (
              <div
                key={route.id}
                onClick={() => {
                  if (isUnlocked) onSelectRoute(route);
                }}
                className={`relative rounded-2xl p-4 sm:p-5 border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer ${
                  !isUnlocked
                    ? 'bg-slate-950/40 border-slate-800 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-950/30 ring-2 ring-emerald-500/30'
                    : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                {/* Route Header & Name */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      ROUTE #{idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        route.difficulty === 'Easy'
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                          : route.difficulty === 'Medium'
                          ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                          : 'bg-red-900/60 text-red-300 border border-red-700/50'
                      }`}
                    >
                      {route.difficulty}
                    </span>
                    {route.coastal && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-900/60 text-sky-300 border border-sky-700/50 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Coastal Scenic Highway</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>{route.name}</span>
                    <span className="text-amber-400 text-sm font-semibold">
                      ({route.tamilName})
                    </span>
                  </h3>

                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    {route.description}
                  </p>

                  {/* Highway Highlights */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {route.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-slate-400"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Route Metrics Cluster */}
                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-700/60">
                  <div className="text-left md:text-right">
                    <div className="text-[11px] font-semibold text-slate-400">DISTANCE</div>
                    <div className="text-base font-black font-mono text-white">
                      {route.distanceKm} km
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-[11px] font-semibold text-slate-400">FARE / PAX</div>
                    <div className="text-base font-black font-mono text-amber-400">
                      ₹{route.farePerPassenger}
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-[11px] font-semibold text-slate-400">EXP. EARNINGS</div>
                    <div className="text-base font-black font-mono text-emerald-400">
                      ₹{expectedEarnings.toLocaleString()}
                    </div>
                  </div>

                  {/* Status / Select Button */}
                  <div>
                    {!isUnlocked ? (
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-bold bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                        <Lock className="w-4 h-4" />
                        <span>LOCKED</span>
                      </div>
                    ) : isSelected ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-black bg-emerald-950/80 px-3 py-2 rounded-xl border border-emerald-600">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>SELECTED</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onSelectRoute(route)}
                        className="text-xs font-bold bg-slate-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition"
                      >
                        SELECT
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Complete earlier routes safely to unlock subsequent southern Tamil Nadu destinations.
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition"
          >
            CONFIRM SELECTION
          </button>
        </div>
      </div>
    </div>
  );
};
