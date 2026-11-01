import { PlayerProfile, DEFAULT_UPGRADES, BUS_MODELS, TAMIL_NADU_ROUTES, JourneyRecord } from '../types/game';

const STORAGE_KEY = 'chennai_highway_bus_driver_v1';

const INITIAL_PROFILE: PlayerProfile = {
  money: 8000, // Starts with ₹8,000 capital for diesel & emergencies
  selectedBusId: 'tnstc-express',
  ownedBusIds: ['tnstc-express'],
  upgrades: {
    'tnstc-express': { ...DEFAULT_UPGRADES },
    'setc-deluxe': { ...DEFAULT_UPGRADES },
    'tamilnadu-sleeper': { ...DEFAULT_UPGRADES },
  },
  unlockedRouteIds: [
    'chennai-villupuram', // First route always unlocked
    'chennai-cuddalore',
  ],
  history: [],
  soundVolume: {
    master: 0.85,
    engine: 0.7,
    horn: 0.9,
    ambience: 0.5,
  },
  hasSeenTutorial: false,
};

export function loadPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_PROFILE,
      ...parsed,
      upgrades: {
        ...INITIAL_PROFILE.upgrades,
        ...(parsed.upgrades || {}),
      },
      soundVolume: {
        ...INITIAL_PROFILE.soundVolume,
        ...(parsed.soundVolume || {}),
      },
    };
  } catch (e) {
    console.error('Failed to load player profile from storage', e);
    return INITIAL_PROFILE;
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save player profile to storage', e);
  }
}

export function resetPlayerProfile(): PlayerProfile {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset storage', e);
  }
  return INITIAL_PROFILE;
}

export function recordCompletedJourney(
  profile: PlayerProfile,
  record: JourneyRecord
): PlayerProfile {
  // Add earnings
  const newMoney = Math.max(0, profile.money + record.finalProfit);

  // Check if we should unlock the next route
  const currentRouteIdx = TAMIL_NADU_ROUTES.findIndex((r) => r.id === record.routeId);
  const unlocked = new Set(profile.unlockedRouteIds);
  if (currentRouteIdx >= 0 && currentRouteIdx + 1 < TAMIL_NADU_ROUTES.length) {
    unlocked.add(TAMIL_NADU_ROUTES[currentRouteIdx + 1].id);
  }

  const updated: PlayerProfile = {
    ...profile,
    money: newMoney,
    unlockedRouteIds: Array.from(unlocked),
    history: [record, ...profile.history.slice(0, 29)], // Keep last 30
  };

  savePlayerProfile(updated);
  return updated;
}
