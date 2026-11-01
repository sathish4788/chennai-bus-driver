import React, { useState } from 'react';
import { CameraView, WeatherType, RouteInfo, BusModelConfig } from '../types/game';
import { Volume2, VolumeX, Eye, AlertTriangle, Fuel, Wrench, ShieldAlert, Sun, CloudRain, Sunset } from 'lucide-react';
import { sound } from '../systems/audio';

interface HUDOverlayProps {
  route: RouteInfo;
  bus: BusModelConfig;
  speedKmh: number;
  rpm: number;
  gear: number;
  distanceCoveredKm: number;
  remainingKm: number;
  progressPercent: number;
  fuelLitres: number;
  fuelPercent: number;
  tempC: number;
  passengers: number;
  playerMoney: number;
  cameraView: CameraView;
  weather: WeatherType;
  headlightsOn: boolean;
  wipersOn: boolean;
  speedWarning: 'none' | 'amber' | 'police' | 'danger';
  recentFine: { amount: number; reason: string } | null;
  hasPuncture: boolean;
  canRefuel: boolean;
  collisionFlash?: boolean;
  recentCollisionMsg?: string | null;
  onCameraToggle: () => void;
  onHonk: () => void;
  onHeadlightsToggle: () => void;
  onWipersToggle: () => void;
  onWeatherChange: (w: WeatherType) => void;
  onOpenRefuelModal: () => void;
  onOpenPunctureModal: () => void;
  // Mobile touch controls callbacks
  onMobileThrottleChange: (val: number) => void;
  onMobileBrakeChange: (val: number) => void;
  onMobileSteerChange: (val: number) => void;
  onMobileHandbrake: (val: boolean) => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  route,
  bus,
  speedKmh,
  rpm,
  gear,
  distanceCoveredKm,
  remainingKm,
  progressPercent,
  fuelLitres,
  fuelPercent,
  tempC,
  passengers,
  playerMoney,
  cameraView,
  weather,
  headlightsOn,
  wipersOn,
  speedWarning,
  recentFine,
  hasPuncture,
  canRefuel,
  collisionFlash,
  recentCollisionMsg,
  onCameraToggle,
  onHonk,
  onHeadlightsToggle,
  onWipersToggle,
  onWeatherChange,
  onOpenRefuelModal,
  onOpenPunctureModal,
  onMobileThrottleChange,
  onMobileBrakeChange,
  onMobileSteerChange,
  onMobileHandbrake,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 overflow-hidden font-sans">
      {/* Collision Damage Flash Overlay */}
      {collisionFlash && (
        <div className="absolute inset-0 border-[10px] border-red-600 bg-red-600/25 pointer-events-none z-50 animate-pulse flex items-center justify-center">
          <div className="bg-red-800/95 border-2 border-yellow-300 text-white font-black text-base sm:text-xl px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3">
            <span className="text-3xl animate-bounce">💥</span>
            <div>
              <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase">TRAFFIC ACCIDENT</div>
              <div>COLLISION DAMAGE FINE -₹1,000 DEDUCTED!</div>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP SECTION: ROUTE PROGRESS & PASSENGER CLUSTER */}
      <div className="flex items-start justify-between gap-3 w-full">
        {/* Left: Destination & Route Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-2xl pointer-events-auto max-w-xs sm:max-w-md">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-600 text-white uppercase tracking-wider">
              {bus.typeBadge}
            </span>
            <span className="text-xs font-semibold text-amber-400">
              NH 45 CORRIDOR
            </span>
          </div>

          <div className="mt-1">
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
              <span>சென்னை</span>
              <span className="text-amber-400">➔</span>
              <span>{route.tamilDestination}</span>
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Chennai to {route.destination} ({route.distanceKm} km)
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>{distanceCoveredKm} km covered</span>
              <span className="text-amber-300 font-bold">{remainingKm} km to go</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Live Speed Warnings & Fines Notification Banner */}
        <div className="flex flex-col items-center gap-2 max-w-sm text-center">
          {recentCollisionMsg && (
            <div className="bg-red-700 border-2 border-yellow-300 text-white font-black px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
              <span className="text-xl">💥</span>
              <span className="text-xs sm:text-sm tracking-wide">{recentCollisionMsg}</span>
            </div>
          )}
          {speedWarning === 'amber' && (
            <div className="bg-amber-500/95 border-2 border-amber-300 text-slate-950 font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-slate-950" />
              <span className="text-xs sm:text-sm tracking-wide">
                REDUCE SPEED – SPEED LIMIT 90 KM/H APPROACHING!
              </span>
            </div>
          )}

          {speedWarning === 'police' && (
            <div className="bg-red-600/95 border-2 border-yellow-300 text-white font-black px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-yellow-300 animate-pulse" />
              <div className="text-left text-xs sm:text-sm">
                <div className="text-yellow-300 uppercase tracking-wider text-[10px]">
                  🚨 POLICE SPEED CHECKPOINT
                </div>
                <div>SPEED LIMIT EXCEEDED! FINE -₹500 ISSUED</div>
              </div>
            </div>
          )}

          {speedWarning === 'danger' && (
            <div className="bg-red-700/95 border-2 border-red-300 text-white font-black px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-300 animate-ping" />
              <span className="text-xs sm:text-sm uppercase tracking-wide">
                DANGER! SPEED LIMIT EXCEEDED! (MAX 90 KM/H)
              </span>
            </div>
          )}

          {recentFine && (
            <div className="bg-red-950/90 border border-red-500 text-red-200 text-xs px-3 py-1 rounded-lg shadow-lg">
              Fine Deducted: -₹{recentFine.amount} ({recentFine.reason})
            </div>
          )}

          {hasPuncture && (
            <div className="bg-amber-600/95 border-2 border-white text-white font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 pointer-events-auto">
              <Wrench className="w-5 h-5 text-white animate-spin" />
              <div className="text-left text-xs">
                <div className="font-black">TYRE PUNCTURE!</div>
                <div>Stop bus safely and tap Repair</div>
              </div>
              <button
                onClick={onOpenPunctureModal}
                className="ml-2 bg-white text-amber-900 font-black px-3 py-1 rounded text-xs hover:bg-amber-100 transition active:scale-95"
              >
                REPAIR (₹500)
              </button>
            </div>
          )}

          {canRefuel && (
            <div className="bg-blue-600/95 border-2 border-yellow-400 text-white font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 pointer-events-auto">
              <Fuel className="w-5 h-5 text-yellow-300" />
              <div className="text-left text-xs">
                <div className="font-black">HIGHWAY PETROL BUNK</div>
                <div>Pull in to refuel diesel</div>
              </div>
              <button
                onClick={onOpenRefuelModal}
                className="ml-2 bg-yellow-400 text-slate-950 font-black px-3 py-1 rounded text-xs hover:bg-yellow-300 transition active:scale-95"
              >
                REFUEL ⛽
              </button>
            </div>
          )}
        </div>

        {/* Right: Passenger Counter & Wallet */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-2xl pointer-events-auto flex flex-col gap-2 min-w-[130px]">
          {/* Passenger Counter */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider">PASSENGERS</span>
            <span className="text-sm font-mono font-black text-emerald-400">
              {passengers} / 40
            </span>
          </div>

          {/* Earnings / Balance */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider">BALANCE</span>
            <span className="text-sm font-mono font-black text-amber-400">
              ₹{playerMoney.toLocaleString()}
            </span>
          </div>

          {/* Diesel Fuel Gauge */}
          <div className="pt-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
              <span>DIESEL</span>
              <span className={fuelLitres < 15 ? 'text-red-400 font-bold animate-pulse' : 'text-slate-300'}>
                {fuelLitres}L ({fuelPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  fuelLitres < 15 ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${fuelPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE VIEWPORT PERIMETER: Prominent Speedometer & Cockpit Dials */}
      <div className="flex items-end justify-between w-full pointer-events-none mt-auto mb-2">
        {/* Left: Engine Diagnostics Pill */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-2.5 backdrop-blur-none text-xs text-slate-300 flex flex-col gap-1 pointer-events-auto shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">GEAR:</span>
            <span className="font-mono font-bold text-white text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {speedKmh < 1 ? 'N' : gear}
            </span>
            <span className="text-slate-400 ml-2">RPM:</span>
            <span className="font-mono font-bold text-sky-400">{Math.round(rpm)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">TEMP:</span>
            <span className={`font-mono font-bold ${tempC > 95 ? 'text-red-400' : 'text-emerald-400'}`}>
              {tempC}°C
            </span>
            <span className="text-slate-400 ml-2">TYRE:</span>
            <span className={`font-mono font-bold ${hasPuncture ? 'text-red-400' : 'text-emerald-400'}`}>
              {hasPuncture ? 'PUNCTURE!' : 'OK'}
            </span>
          </div>
        </div>

        {/* Right: Prominent Tamil Nadu Speedometer (Speed Limit strictly 90 km/h) */}
        <div className="bg-slate-900/95 border-2 border-slate-700 rounded-2xl p-3 sm:p-4 shadow-2xl pointer-events-auto flex flex-col items-center min-w-[150px] sm:min-w-[180px]">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            SPEEDOMETER
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span
              className={`font-mono font-black text-4xl sm:text-5xl tabular-nums ${
                speedKmh > 90
                  ? 'text-red-500 animate-pulse'
                  : speedKmh >= 87
                  ? 'text-red-400'
                  : speedKmh >= 80
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {Math.round(speedKmh)}
            </span>
            <span className="text-xs font-bold text-slate-400">KM/H</span>
          </div>

          {/* Speed Limit Indicator Pill */}
          <div className="flex items-center gap-1.5 mt-1 bg-slate-800/90 px-2 py-1 rounded-full border border-slate-700 text-[11px] font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span className="text-slate-300">MAX:</span>
            <span className="text-white font-black font-mono">90 KM/H</span>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: COLLAPSIBLE DOCK & MOBILE TOUCH CONTROLS */}
      <div className="flex flex-col items-center gap-2 w-full pointer-events-auto">
        {/* Mobile Touch Driving Controls (Rendered on touch devices or smaller screens) */}
        <div className="w-full flex items-center justify-between px-2 sm:px-8 mb-1">
          {/* Steering Controls (Left / Right) */}
          <div className="flex items-center gap-2">
            <button
              onPointerDown={() => onMobileSteerChange(-1)}
              onPointerUp={() => onMobileSteerChange(0)}
              onPointerLeave={() => onMobileSteerChange(0)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/90 active:bg-slate-700 border-2 border-slate-600 text-white font-black text-xl flex items-center justify-center shadow-2xl active:scale-95 transition"
            >
              ◀
            </button>
            <button
              onPointerDown={() => onMobileSteerChange(1)}
              onPointerUp={() => onMobileSteerChange(0)}
              onPointerLeave={() => onMobileSteerChange(0)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/90 active:bg-slate-700 border-2 border-slate-600 text-white font-black text-xl flex items-center justify-center shadow-2xl active:scale-95 transition"
            >
              ▶
            </button>
          </div>

          {/* Big Indian Musical Air Horn Button */}
          <button
            onClick={onHonk}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm sm:text-base border-2 border-amber-300 shadow-2xl active:scale-90 transition flex items-center gap-2 uppercase tracking-wider"
          >
            <span>🎺 HORN</span>
            <span className="text-xs opacity-75">(H)</span>
          </button>

          {/* Pedals (Brake & Accelerator) */}
          <div className="flex items-center gap-2">
            <button
              onPointerDown={() => onMobileBrakeChange(1)}
              onPointerUp={() => onMobileBrakeChange(0)}
              onPointerLeave={() => onMobileBrakeChange(0)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-600/90 active:bg-red-700 border-2 border-red-400 text-white font-black text-xs sm:text-sm flex flex-col items-center justify-center shadow-2xl active:scale-95 transition"
            >
              <span>BRAKE</span>
              <span className="text-[10px] opacity-75">(S)</span>
            </button>
            <button
              onPointerDown={() => onMobileThrottleChange(1)}
              onPointerUp={() => onMobileThrottleChange(0)}
              onPointerLeave={() => onMobileThrottleChange(0)}
              className="w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-emerald-600/90 active:bg-emerald-700 border-2 border-emerald-400 text-white font-black text-xs sm:text-sm flex flex-col items-center justify-center shadow-2xl active:scale-95 transition"
            >
              <span>DRIVE</span>
              <span className="text-[10px] opacity-75">(W)</span>
            </button>
          </div>
        </div>

        {/* Collapsible Unified Bottom Control Dock */}
        <div className="w-full max-w-3xl flex flex-col items-center">
          {/* Collapse/Expand Toggle Pill */}
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="bg-slate-900/90 border border-slate-700 px-3 py-0.5 rounded-t-lg text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center gap-1 shadow-md"
          >
            <span>{isDockCollapsed ? '▴ Show Bus Controls' : '▾ Hide Controls'}</span>
          </button>

          {!isDockCollapsed && (
            <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2">
              {/* Camera Switch Button: MANDATORY FEATURE */}
              <button
                onClick={onCameraToggle}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition text-white font-bold text-xs sm:text-sm shadow-md"
              >
                <Eye className="w-4 h-4" />
                <span>
                  {cameraView === 'exterior' ? 'SWITCH TO DRIVER VIEW (C)' : 'SWITCH TO EXTERIOR VIEW (C)'}
                </span>
              </button>

              {/* Weather Selector */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
                <button
                  onClick={() => onWeatherChange('sunny')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    weather === 'sunny' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Sunny Morning"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sunny</span>
                </button>
                <button
                  onClick={() => onWeatherChange('sunset')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    weather === 'sunset' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Golden Sunset"
                >
                  <Sunset className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sunset</span>
                </button>
                <button
                  onClick={() => onWeatherChange('rain')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    weather === 'rain' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Monsoon Rain"
                >
                  <CloudRain className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rain</span>
                </button>
              </div>

              {/* Toggles: Lights & Audio */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onHeadlightsToggle}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    headlightsOn
                      ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span>💡 Lights</span>
                </button>

                <button
                  onClick={toggleSound}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
                  title="Mute / Unmute"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
