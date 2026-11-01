import React from 'react';
import { BusModelConfig, BusUpgrades, BUS_MODELS } from '../types/game';
import { X, Wrench, Shield, Zap, Gauge, Wind, Fuel, ShoppingCart, Check } from 'lucide-react';
import { sound } from '../systems/audio';

interface BusGarageModalProps {
  playerMoney: number;
  ownedBusIds: string[];
  selectedBusId: string;
  upgrades: Record<string, BusUpgrades>;
  onSelectBus: (busId: string) => void;
  onBuyBus: (bus: BusModelConfig) => void;
  onUpgradeBus: (busId: string, upgradeKey: keyof BusUpgrades, cost: number) => void;
  onClose: () => void;
}

export const BusGarageModal: React.FC<BusGarageModalProps> = ({
  playerMoney,
  ownedBusIds,
  selectedBusId,
  upgrades,
  onSelectBus,
  onBuyBus,
  onUpgradeBus,
  onClose,
}) => {
  const currentBus = BUS_MODELS.find((b) => b.id === selectedBusId) || BUS_MODELS[0];
  const busUpgrades = upgrades[selectedBusId] || {
    engineLevel: 1,
    tyreLevel: 1,
    brakeLevel: 1,
    fuelTankLevel: 1,
    suspensionLevel: 1,
    hasAirConditioning: false,
  };

  const handleUpgrade = (key: keyof BusUpgrades, cost: number) => {
    if (playerMoney >= cost) {
      sound.playCashChime();
      onUpgradeBus(selectedBusId, key, cost);
    }
  };

  const UPGRADE_CONFIGS = [
    {
      key: 'engineLevel' as const,
      name: 'Engine Tuning & Injectors',
      icon: Zap,
      desc: 'Improves diesel fuel efficiency (km/l) and gives smoother highway pickup.',
      level: busUpgrades.engineLevel,
      maxLevel: 5,
      cost: busUpgrades.engineLevel * 1200,
    },
    {
      key: 'tyreLevel' as const,
      name: 'Heavy Radial Tyres',
      icon: Shield,
      desc: 'Reinforced steel-belted highway tyres that dramatically reduce puncture chance from road debris.',
      level: busUpgrades.tyreLevel,
      maxLevel: 5,
      cost: busUpgrades.tyreLevel * 1000,
    },
    {
      key: 'brakeLevel' as const,
      name: 'Pneumatic Air Brakes',
      icon: Gauge,
      desc: 'Dual-circuit air brakes with faster response time and shorter stopping distances.',
      level: busUpgrades.brakeLevel,
      maxLevel: 5,
      cost: busUpgrades.brakeLevel * 900,
    },
    {
      key: 'fuelTankLevel' as const,
      name: 'Extended Fuel Tank',
      icon: Fuel,
      desc: 'Expands diesel capacity by +20 litres per level for non-stop long distance cruising.',
      level: busUpgrades.fuelTankLevel,
      maxLevel: 5,
      cost: busUpgrades.fuelTankLevel * 800,
    },
    {
      key: 'suspensionLevel' as const,
      name: 'Air Suspension Kit',
      icon: Wind,
      desc: 'Soft air bellows suspension that reduces turning body roll and ensures comfortable passenger ride.',
      level: busUpgrades.suspensionLevel,
      maxLevel: 5,
      cost: busUpgrades.suspensionLevel * 1100,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-950 border border-sky-700/50 text-sky-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span>TAMIL NADU BUS GARAGE</span>
                <span className="text-xs font-bold text-amber-400 font-sans">
                  பேருந்து பணிமனை
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upgrade your fleet or purchase new intercity highway coaches using your earnings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-800/90 border border-slate-700 px-4 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">YOUR BALANCE:</span>
              <span className="text-base font-black font-mono text-amber-400">
                ₹{playerMoney.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Fleet Selection Carousel / Cards */}
          <div>
            <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase mb-3">
              1. SELECT / UNLOCK BUS MODEL
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BUS_MODELS.map((bus) => {
                const isOwned = ownedBusIds.includes(bus.id);
                const isSelected = selectedBusId === bus.id;
                const canAfford = playerMoney >= bus.price;

                return (
                  <div
                    key={bus.id}
                    onClick={() => {
                      if (isOwned) onSelectBus(bus.id);
                    }}
                    className={`rounded-2xl p-4 border-2 transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-xl'
                        : isOwned
                        ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500 cursor-pointer'
                        : 'bg-slate-950/40 border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Livery swatch */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {bus.typeBadge}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block"
                            style={{ backgroundColor: bus.bodyColor }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block"
                            style={{ backgroundColor: bus.stripeColor }}
                          />
                        </div>
                      </div>

                      <h4 className="text-base font-black text-white">{bus.name}</h4>
                      <p className="text-xs text-amber-400 font-semibold mb-2">
                        {bus.tamilName}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {bus.description}
                      </p>

                      {/* Specs */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        <div>TOP SPEED: {bus.topSpeed} KM/H</div>
                        <div>TANK: {bus.fuelCapacity}L</div>
                        <div>MILEAGE: {bus.fuelEfficiencyKmPerL} KM/L</div>
                        <div>RATING: {bus.price === 0 ? 'STANDARD' : 'SUPERIOR'}</div>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="mt-4 pt-3 border-t border-slate-700/60">
                      {isOwned ? (
                        isSelected ? (
                          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-emerald-400 py-1.5 bg-emerald-950/60 rounded-xl border border-emerald-700/60">
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>CURRENTLY ACTIVE</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onSelectBus(bus.id)}
                            className="w-full py-2 rounded-xl bg-slate-700 hover:bg-blue-600 text-white font-bold text-xs transition"
                          >
                            SELECT THIS BUS
                          </button>
                        )
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            if (canAfford) {
                              sound.playCashChime();
                              onBuyBus(bus);
                            }
                          }}
                          className={`w-full py-2 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:scale-[1.02] shadow-lg'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>BUY BUS (₹{bus.price.toLocaleString()})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Bus Upgrades for Active Bus */}
          <div>
            <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase mb-3">
              2. UPGRADE ACTIVE BUS: {currentBus.name}
            </h3>

            <div className="space-y-3">
              {UPGRADE_CONFIGS.map((cfg) => {
                const isMax = cfg.level >= cfg.maxLevel;
                const canAfford = playerMoney >= cfg.cost;
                const IconComponent = cfg.icon;

                return (
                  <div
                    key={cfg.key}
                    className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2.5 rounded-xl bg-slate-900 text-amber-400 border border-slate-700">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-white text-sm">{cfg.name}</h4>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-700">
                            LEVEL {cfg.level} / {cfg.maxLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">{cfg.desc}</p>
                      </div>
                    </div>

                    {/* Progress Pips & Upgrade Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700">
                      {/* 5-pip indicator */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: cfg.maxLevel }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-3.5 h-2.5 rounded-sm ${
                              i < cfg.level ? 'bg-emerald-400' : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>

                      {isMax ? (
                        <span className="text-xs font-black text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60">
                          MAX LEVEL
                        </span>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => handleUpgrade(cfg.key, cfg.cost)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                            canAfford
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <span>UPGRADE (₹{cfg.cost.toLocaleString()})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            All upgrades are permanently saved to your bus profile.
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition"
          >
            CLOSE GARAGE
          </button>
        </div>
      </div>
    </div>
  );
};
