import React from 'react';
import { RouteInfo, BusModelConfig } from '../types/game';
import { Play, MapPin, Wrench, Settings, ArrowRight, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TitleScreenProps {
  selectedRoute: RouteInfo;
  selectedBus: BusModelConfig;
  playerMoney: number;
  onStartJourney: () => void;
  onOpenRoutes: () => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedRoute,
  selectedBus,
  playerMoney,
  onStartJourney,
  onOpenRoutes,
  onOpenGarage,
  onOpenSettings,
}) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-8 pointer-events-none select-none font-sans">
      {/* 1. TOP BAR: Branding Badge & Player Wallet */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-full shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs sm:text-sm font-black tracking-wide text-white">
            CHENNAI CMBT TERMINAL
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-700 text-white font-bold uppercase">
            LIVE 3D
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* PWA Install Button (Top) */}
          {(!isInstalled && (isInstallable || isIOS)) && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-3.5 py-1.5 rounded-full text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              <span>INSTALL APP</span>
            </button>
          )}

          <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">WALLET:</span>
            <span className="text-sm sm:text-base font-black font-mono text-amber-400">
              ₹{playerMoney.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CENTER LOCKUP: Bespoke Title & Negative Space */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-auto text-center px-4">
        {/* State Express Transport Emblem */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-400/50 text-amber-300 text-xs sm:text-sm font-bold uppercase tracking-widest mb-3 shadow-lg">
          <span>தமிழ்நாடு அரசு விரைவுப் பேருந்து</span>
        </div>

        {/* Game Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          CHENNAI HIGHWAY
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400">
            BUS DRIVER
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-sm sm:text-lg font-medium text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] max-w-xl">
          Drive Safe. Reach On Time. Earn More.
        </p>

        {/* Selected Route Preview Pill */}
        <button
          onClick={onOpenRoutes}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-emerald-500/80 text-white shadow-2xl transition group"
        >
          <MapPin className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          <div className="text-left text-xs sm:text-sm">
            <span className="text-slate-400 font-semibold">ROUTE: </span>
            <span className="font-bold text-amber-300">சென்னை ➔ {selectedRoute.tamilDestination}</span>
            <span className="text-slate-300 ml-1">({selectedRoute.distanceKm} km · ₹{selectedRoute.farePerPassenger}/pax)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition" />
        </button>
      </div>

      {/* 3. BOTTOM BUTTONS: Start Journey & Hub Actions */}
      <div className="flex flex-col items-center gap-3 w-full pointer-events-auto">
        {/* Main CTA: START JOURNEY */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-2xl">
          <button
            onClick={onStartJourney}
            className="flex-1 min-w-[220px] py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 transition text-white font-black text-lg sm:text-xl shadow-[0_10px_25px_rgba(16,185,129,0.4)] border border-emerald-400/50 flex items-center justify-center gap-3 uppercase tracking-wider"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>START JOURNEY (BOARD 40 PAX)</span>
          </button>
        </div>

        {/* Secondary Hub Actions: Garage, Routes, Settings */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={onOpenRoutes}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Select Destination</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition"
          >
            <Wrench className="w-4 h-4 text-sky-400" />
            <span>Bus Garage & Upgrades</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>

        {/* Control Hints Line */}
        <div className="text-[11px] sm:text-xs font-mono text-slate-400 tracking-wider">
          WASD / Arrows to Drive · Space Brake · C Camera View · H Indian Horn
        </div>
      </div>
    </div>
  );
};
