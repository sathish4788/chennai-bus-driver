/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CameraView,
  WeatherType,
  RouteInfo,
  BusModelConfig,
  TAMIL_NADU_ROUTES,
  BUS_MODELS,
  PlayerProfile,
  DEFAULT_UPGRADES,
  DrivingRating,
} from './types/game';
import { loadPlayerProfile, savePlayerProfile, resetPlayerProfile, recordCompletedJourney } from './systems/storage';
import { sound } from './systems/audio';
import { GameScene, GameSceneControls } from './three/gameScene';
import { TitleScreen } from './components/TitleScreen';
import { HUDOverlay } from './components/HUDOverlay';
import { RouteSelectModal } from './components/RouteSelectModal';
import { BusGarageModal } from './components/BusGarageModal';
import { SettingsModal } from './components/SettingsModal';
import { PetrolBunkModal } from './components/PetrolBunkModal';
import { PunctureModal } from './components/PunctureModal';
import { ArrivalSummaryModal } from './components/ArrivalSummaryModal';
import { OfflineToast } from './components/OfflineToast';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const gameSceneRef = useRef<GameScene | null>(null);

  // Profile and Save State
  const [profile, setProfile] = useState<PlayerProfile>(loadPlayerProfile);

  // Active Journey Setup
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo>(() => {
    return TAMIL_NADU_ROUTES.find((r) => r.id === profile.unlockedRouteIds[0]) || TAMIL_NADU_ROUTES[0];
  });

  const selectedBus = BUS_MODELS.find((b) => b.id === profile.selectedBusId) || BUS_MODELS[0];
  const activeUpgrades = profile.upgrades[selectedBus.id] || DEFAULT_UPGRADES;

  // Game Flow State
  const [gameState, setGameState] = useState<
    'TITLE' | 'BOARDING' | 'DRIVING' | 'PETROL_BUNK' | 'PUNCTURE' | 'ARRIVED'
  >('TITLE');

  // Modals
  const [showRoutesModal, setShowRoutesModal] = useState(false);
  const [showGarageModal, setShowGarageModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Journey Telemetry State
  const [speedKmh, setSpeedKmh] = useState(0);
  const [rpm, setRpm] = useState(750);
  const [gear, setGear] = useState(1);
  const [distanceCoveredKm, setDistanceCoveredKm] = useState(0);
  const [remainingKm, setRemainingKm] = useState(selectedRoute.distanceKm);
  const [progressPercent, setProgressPercent] = useState(0);
  const [fuelLitres, setFuelLitres] = useState(108);
  const [fuelPercent, setFuelPercent] = useState(90);
  const [tempC, setTempC] = useState(82);
  const [passengers, setPassengers] = useState(0);

  // Camera & Environment
  const [cameraView, setCameraView] = useState<CameraView>('exterior');
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [headlightsOn, setHeadlightsOn] = useState(false);
  const [wipersOn, setWipersOn] = useState(false);

  // Driving Warnings & Financials
  const [speedWarning, setSpeedWarning] = useState<'none' | 'amber' | 'police' | 'danger'>('none');
  const [recentFine, setRecentFine] = useState<{ amount: number; reason: string } | null>(null);
  const [totalFines, setTotalFines] = useState(0);
  const [totalFuelCost, setTotalFuelCost] = useState(0);
  const [totalRepairCost, setTotalRepairCost] = useState(0);
  const [hasPuncture, setHasPuncture] = useState(false);
  const [canRefuel, setCanRefuel] = useState(false);
  const [collisionFlash, setCollisionFlash] = useState(false);
  const [recentCollisionMsg, setRecentCollisionMsg] = useState<string | null>(null);

  // End of Journey Calculations
  const [journeySummary, setJourneySummary] = useState<{
    fareCollected: number;
    onTimeBonus: number;
    latePenalty: number;
    finalProfit: number;
    rating: DrivingRating;
  } | null>(null);

  // Controls input reference (to avoid React re-renders in physics loop)
  const controlsRef = useRef<GameSceneControls>({
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    cameraView: 'exterior',
    headlights: false,
    wipers: false,
  });

  // Keep cameraView & headlights synced into controlsRef
  useEffect(() => {
    controlsRef.current.cameraView = cameraView;
  }, [cameraView]);

  useEffect(() => {
    controlsRef.current.headlights = headlightsOn;
  }, [headlightsOn]);

  useEffect(() => {
    controlsRef.current.wipers = wipersOn;
  }, [wipersOn]);

  // Synchronize audio volumes with stored profile
  useEffect(() => {
    sound.setVolumes(
      profile.soundVolume.master,
      profile.soundVolume.engine,
      profile.soundVolume.horn,
      profile.soundVolume.ambience
    );
  }, [profile.soundVolume]);

  // 1. Initialize Three.js Scene
  const initScene = useCallback(
    (targetRoute: RouteInfo, targetBus: BusModelConfig) => {
      if (!canvasMountRef.current) return;

      if (gameSceneRef.current) {
        gameSceneRef.current.dispose();
        gameSceneRef.current = null;
      }

      const scene = new GameScene(
        canvasMountRef.current,
        targetRoute,
        targetBus,
        activeUpgrades,
        {
          onSpeedWarning: (lvl) => setSpeedWarning(lvl),
          onFineIssued: (amt, reason) => {
            setRecentFine({ amount: amt, reason });
            setTotalFines((prev) => prev + amt);
            setProfile((prev) => {
              const updated = { ...prev, money: Math.max(0, prev.money - amt) };
              savePlayerProfile(updated);
              return updated;
            });
            setTimeout(() => setRecentFine(null), 5000);
          },
          onVehicleCollision: (vehicleName, fineAmount) => {
            setCollisionFlash(true);
            setRecentCollisionMsg(`💥 ACCIDENT WITH ${vehicleName.toUpperCase()}! FINE -₹${fineAmount.toLocaleString()}`);
            setRecentFine({ amount: fineAmount, reason: `Accident with ${vehicleName}` });
            setTotalFines((prev) => prev + fineAmount);
            setProfile((prev) => {
              const updated = { ...prev, money: Math.max(0, prev.money - fineAmount) };
              savePlayerProfile(updated);
              return updated;
            });
            setTimeout(() => setCollisionFlash(false), 750);
            setTimeout(() => setRecentCollisionMsg(null), 4500);
          },
          onLowFuelWarning: () => {
            // Already reflected in fuel gauge
          },
          onPuncture: () => {
            setHasPuncture(true);
          },
          onNearPetrolBunk: (near) => {
            setCanRefuel(near);
          },
          onArrival: () => {
            // Reached destination stand!
            handleArrival();
          },
          onTelemetryUpdate: (data) => {
            setSpeedKmh(data.speedKmh);
            setRpm(data.rpm);
            setGear(data.gear);
            setDistanceCoveredKm(data.distanceCoveredKm);
            setRemainingKm(data.remainingKm);
            setProgressPercent(data.progressPercent);
            setFuelLitres(data.fuelLitres);
            setFuelPercent(data.fuelPercent);
            setTempC(data.tempC);
          },
        }
      );

      gameSceneRef.current = scene;
    },
    [activeUpgrades]
  );

  // Mount scene once on startup
  useEffect(() => {
    initScene(selectedRoute, selectedBus);
    return () => {
      if (gameSceneRef.current) {
        gameSceneRef.current.dispose();
        gameSceneRef.current = null;
      }
    };
  }, []);

  // 2. Physics Simulation Loop (60fps decoupled from React)
  useEffect(() => {
    let animId: number;
    let lastTick = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTick) / 1000;
      lastTick = time;

      if (gameSceneRef.current) {
        gameSceneRef.current.step(dt, controlsRef.current);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 3. Desktop Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          controlsRef.current.throttle = 1;
          break;
        case 'KeyS':
        case 'ArrowDown':
          controlsRef.current.brake = 1;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          controlsRef.current.steer = -1;
          break;
        case 'KeyD':
        case 'ArrowRight':
          controlsRef.current.steer = 1;
          break;
        case 'Space':
          e.preventDefault();
          controlsRef.current.handbrake = true;
          break;
        case 'KeyC':
          // Toggle Camera View
          setCameraView((prev) => (prev === 'exterior' ? 'cockpit' : 'exterior'));
          break;
        case 'KeyH':
          // Honk
          if (gameSceneRef.current) gameSceneRef.current.honk();
          break;
        case 'KeyL':
          // Headlights
          setHeadlightsOn((prev) => !prev);
          break;
        case 'KeyE':
          // Interaction (Refuel or Repair)
          if (canRefuel) setGameState('PETROL_BUNK');
          else if (hasPuncture) setGameState('PUNCTURE');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          controlsRef.current.throttle = 0;
          break;
        case 'KeyS':
        case 'ArrowDown':
          controlsRef.current.brake = 0;
          break;
        case 'KeyA':
        case 'ArrowLeft':
        case 'KeyD':
        case 'ArrowRight':
          controlsRef.current.steer = 0;
          break;
        case 'Space':
          controlsRef.current.handbrake = false;
          break;
      }
    };

    const handleBlur = () => {
      controlsRef.current.throttle = 0;
      controlsRef.current.brake = 0;
      controlsRef.current.steer = 0;
      controlsRef.current.handbrake = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [canRefuel, hasPuncture]);

  // 4. Mouse / Touch Camera Orbit for Exterior View
  useEffect(() => {
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onPointerDown = (e: PointerEvent) => {
      // Only drag if not clicking on interactive buttons
      if ((e.target as HTMLElement).closest('button, input, select')) return;
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !gameSceneRef.current || cameraView === 'cockpit') return;
      const dx = (e.clientX - prevX) * 0.005;
      const dy = (e.clientY - prevY) * 0.003;
      prevX = e.clientX;
      prevY = e.clientY;

      gameSceneRef.current.cameraOrbitYaw += dx;
      gameSceneRef.current.cameraOrbitPitch = Math.max(
        -0.2,
        Math.min(0.5, gameSceneRef.current.cameraOrbitPitch + dy)
      );
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [cameraView]);

  // 5. Start Journey & Board Passengers Action
  const handleStartJourney = () => {
    setGameState('BOARDING');
    setPassengers(0);

    // Boarding animation in 3D scene
    if (gameSceneRef.current) {
      gameSceneRef.current.startBoarding(() => {
        // Boarding complete!
        setPassengers(40);
        sound.playCashChime();
        // Collect fares: 40 x Fare
        const fare = selectedRoute.farePerPassenger * 40;
        setProfile((prev) => {
          const updated = { ...prev, money: prev.money + fare };
          savePlayerProfile(updated);
          return updated;
        });
        setGameState('DRIVING');
      });
    }

    // Tick up passenger counter gradually during boarding
    let pCount = 0;
    const interval = setInterval(() => {
      pCount += 5;
      if (pCount <= 40) {
        setPassengers(pCount);
      } else {
        clearInterval(interval);
      }
    }, 350);
  };

  // 6. Arrival Handling
  const handleArrival = () => {
    setGameState('ARRIVED');
    if (gameSceneRef.current) {
      gameSceneRef.current.startAlighting(() => {
        // Passengers alighted safely
      });
    }

    // Calculate Financials & Rating
    const fare = selectedRoute.farePerPassenger * 40;
    const bonus = 1000; // Punctuality bonus
    const penalty = 0;
    const profit = Math.max(0, fare + bonus - totalFines - totalFuelCost - totalRepairCost);

    let rating: DrivingRating = 'Excellent';
    if (totalFines > 1000 || totalRepairCost > 500) {
      rating = 'Needs Improvement';
    } else if (totalFines > 0) {
      rating = 'Good';
    }

    setJourneySummary({
      fareCollected: fare,
      onTimeBonus: bonus,
      latePenalty: penalty,
      finalProfit: profit,
      rating,
    });

    // Record journey in save profile
    const record = {
      id: `journey-${Date.now()}`,
      routeId: selectedRoute.id,
      routeName: selectedRoute.name,
      completedAt: new Date().toLocaleDateString(),
      distanceKm: selectedRoute.distanceKm,
      fareCollected: fare,
      onTimeBonus: bonus,
      speedingFines: totalFines,
      fuelCost: totalFuelCost,
      repairCost: totalRepairCost,
      latePenalty: penalty,
      finalProfit: profit,
      rating,
    };

    const updated = recordCompletedJourney(profile, record);
    setProfile(updated);
  };

  // 7. Restart for next journey or return to CMBT
  const handleReturnToDepot = () => {
    setGameState('TITLE');
    setTotalFines(0);
    setTotalFuelCost(0);
    setTotalRepairCost(0);
    setHasPuncture(false);
    setJourneySummary(null);
    setDistanceCoveredKm(0);
    setProgressPercent(0);
    setPassengers(0);
    setSpeedKmh(0);
    initScene(selectedRoute, selectedBus);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* STARTING SCREEN (CMBT Koyambedu Live Staging) */}
      {gameState === 'TITLE' && (
        <TitleScreen
          selectedRoute={selectedRoute}
          selectedBus={selectedBus}
          playerMoney={profile.money}
          onStartJourney={handleStartJourney}
          onOpenRoutes={() => setShowRoutesModal(true)}
          onOpenGarage={() => setShowGarageModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      )}

      {/* BOARDING PASSENGERS OVERLAY */}
      {gameState === 'BOARDING' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm pointer-events-none text-white text-center p-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-600 border-2 border-emerald-400 p-3 shadow-2xl flex items-center justify-center mb-3 animate-pulse">
            <span className="text-2xl">🚌</span>
          </div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            CHENNAI CMBT PLATFORM 12
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mt-1">
            BOARDING PASSENGERS & COLLECTING FARES
          </h2>
          <div className="mt-3 text-lg font-mono font-black text-emerald-400">
            PASSENGERS: {passengers} / 40
          </div>
          <p className="mt-2 text-xs text-slate-300 max-w-sm">
            Conductor issuing tickets: ₹{selectedRoute.farePerPassenger} × 40 = ₹{(selectedRoute.farePerPassenger * 40).toLocaleString()}
          </p>
        </div>
      )}

      {/* IN-GAME DRIVING HUD OVERLAY */}
      {(gameState === 'DRIVING' || gameState === 'PETROL_BUNK' || gameState === 'PUNCTURE') && (
        <HUDOverlay
          route={selectedRoute}
          bus={selectedBus}
          speedKmh={speedKmh}
          rpm={rpm}
          gear={gear}
          distanceCoveredKm={distanceCoveredKm}
          remainingKm={remainingKm}
          progressPercent={progressPercent}
          fuelLitres={fuelLitres}
          fuelPercent={fuelPercent}
          tempC={tempC}
          passengers={passengers}
          playerMoney={profile.money}
          cameraView={cameraView}
          weather={weather}
          headlightsOn={headlightsOn}
          wipersOn={wipersOn}
          speedWarning={speedWarning}
          recentFine={recentFine}
          hasPuncture={hasPuncture}
          canRefuel={canRefuel}
          collisionFlash={collisionFlash}
          recentCollisionMsg={recentCollisionMsg}
          onCameraToggle={() => setCameraView((prev) => (prev === 'exterior' ? 'cockpit' : 'exterior'))}
          onHonk={() => gameSceneRef.current?.honk()}
          onHeadlightsToggle={() => setHeadlightsOn((prev) => !prev)}
          onWipersToggle={() => setWipersOn((prev) => !prev)}
          onWeatherChange={(w) => {
            setWeather(w);
            gameSceneRef.current?.setWeather(w);
          }}
          onOpenRefuelModal={() => setGameState('PETROL_BUNK')}
          onOpenPunctureModal={() => setGameState('PUNCTURE')}
          onMobileThrottleChange={(val) => {
            controlsRef.current.throttle = val;
          }}
          onMobileBrakeChange={(val) => {
            controlsRef.current.brake = val;
          }}
          onMobileSteerChange={(val) => {
            controlsRef.current.steer = val;
          }}
          onMobileHandbrake={(val) => {
            controlsRef.current.handbrake = val;
          }}
        />
      )}

      {/* REFUEL MODAL (When at petrol bunk) */}
      {gameState === 'PETROL_BUNK' && (
        <PetrolBunkModal
          currentFuel={fuelLitres}
          maxFuel={selectedBus.fuelCapacity + (activeUpgrades.fuelTankLevel - 1) * 20}
          playerMoney={profile.money}
          onRefuel={(litres, cost) => {
            if (gameSceneRef.current) gameSceneRef.current.refuel(litres);
            setTotalFuelCost((prev) => prev + cost);
            setProfile((prev) => {
              const updated = { ...prev, money: Math.max(0, prev.money - cost) };
              savePlayerProfile(updated);
              return updated;
            });
          }}
          onClose={() => setGameState('DRIVING')}
        />
      )}

      {/* PUNCTURE REPAIR MODAL */}
      {gameState === 'PUNCTURE' && (
        <PunctureModal
          playerMoney={profile.money}
          onRepairComplete={(cost) => {
            if (gameSceneRef.current) gameSceneRef.current.repairPuncture();
            setHasPuncture(false);
            setTotalRepairCost((prev) => prev + cost);
            setProfile((prev) => {
              const updated = { ...prev, money: Math.max(0, prev.money - cost) };
              savePlayerProfile(updated);
              return updated;
            });
          }}
          onClose={() => setGameState('DRIVING')}
        />
      )}

      {/* ARRIVAL SUMMARY MODAL */}
      {gameState === 'ARRIVED' && journeySummary && (
        <ArrivalSummaryModal
          route={selectedRoute}
          bus={selectedBus}
          passengers={40}
          fareCollected={journeySummary.fareCollected}
          onTimeBonus={journeySummary.onTimeBonus}
          speedingFines={totalFines}
          fuelCost={totalFuelCost}
          repairCost={totalRepairCost}
          latePenalty={journeySummary.latePenalty}
          finalProfit={journeySummary.finalProfit}
          rating={journeySummary.rating}
          onContinue={handleReturnToDepot}
        />
      )}

      {/* ROUTE SELECT MODAL */}
      {showRoutesModal && (
        <RouteSelectModal
          unlockedRouteIds={profile.unlockedRouteIds}
          selectedRouteId={selectedRoute.id}
          onSelectRoute={(r) => {
            setSelectedRoute(r);
            initScene(r, selectedBus);
          }}
          onClose={() => setShowRoutesModal(false)}
        />
      )}

      {/* BUS GARAGE MODAL */}
      {showGarageModal && (
        <BusGarageModal
          playerMoney={profile.money}
          ownedBusIds={profile.ownedBusIds}
          selectedBusId={profile.selectedBusId}
          upgrades={profile.upgrades}
          onSelectBus={(busId) => {
            const bus = BUS_MODELS.find((b) => b.id === busId) || BUS_MODELS[0];
            setProfile((prev) => {
              const updated = { ...prev, selectedBusId: busId };
              savePlayerProfile(updated);
              return updated;
            });
            initScene(selectedRoute, bus);
          }}
          onBuyBus={(bus) => {
            setProfile((prev) => {
              const updated = {
                ...prev,
                money: prev.money - bus.price,
                ownedBusIds: [...prev.ownedBusIds, bus.id],
                selectedBusId: bus.id,
              };
              savePlayerProfile(updated);
              return updated;
            });
            initScene(selectedRoute, bus);
          }}
          onUpgradeBus={(busId, upgradeKey, cost) => {
            setProfile((prev) => {
              const currentBusUpgrades = prev.upgrades[busId] || { ...DEFAULT_UPGRADES };
              const currentLvl = currentBusUpgrades[upgradeKey] as number;
              const updatedUpgrades = {
                ...prev.upgrades,
                [busId]: {
                  ...currentBusUpgrades,
                  [upgradeKey]: typeof currentLvl === 'number' ? currentLvl + 1 : true,
                },
              };
              const updated = {
                ...prev,
                money: prev.money - cost,
                upgrades: updatedUpgrades,
              };
              savePlayerProfile(updated);
              return updated;
            });
          }}
          onClose={() => setShowGarageModal(false)}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <SettingsModal
          profile={profile}
          onUpdateVolume={(v) => {
            setProfile((prev) => {
              const updated = { ...prev, soundVolume: v };
              savePlayerProfile(updated);
              return updated;
            });
          }}
          onResetData={() => {
            const fresh = resetPlayerProfile();
            setProfile(fresh);
            setSelectedRoute(TAMIL_NADU_ROUTES[0]);
            initScene(TAMIL_NADU_ROUTES[0], BUS_MODELS[0]);
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* OFFLINE INDICATOR TOAST */}
      <OfflineToast />
    </div>
  );
}
