export type CameraView = 'exterior' | 'cockpit';
export type WeatherType = 'sunny' | 'afternoon' | 'sunset' | 'rain';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Challenging';
export type DrivingRating = 'Excellent' | 'Good' | 'Needs Improvement';

export interface RouteInfo {
  id: string;
  name: string;
  tamilName: string;
  destination: string;
  tamilDestination: string;
  distanceKm: number; // e.g. 150 for Villupuram
  durationMins: number; // In-game estimated journey minutes
  farePerPassenger: number; // in INR
  difficulty: DifficultyLevel;
  coastal: boolean;
  description: string;
  highlights: string[];
}

export interface BusModelConfig {
  id: string;
  name: string;
  tamilName: string;
  description: string;
  price: number;
  unlocked: boolean;
  topSpeed: number; // km/h, max 90
  acceleration: number; // relative 0-1
  handling: number;
  fuelCapacity: number; // litres
  fuelEfficiencyKmPerL: number; // e.g. 4.0 km/l
  bodyColor: string;
  stripeColor: string;
  roofColor: string;
  typeBadge: string;
}

export interface BusUpgrades {
  engineLevel: number; // 1 to 5 (improves km/l and acceleration)
  tyreLevel: number; // 1 to 5 (reduces puncture risk)
  brakeLevel: number; // 1 to 5 (shortens braking distance)
  fuelTankLevel: number; // 1 to 5 (increases tank capacity)
  suspensionLevel: number; // 1 to 5 (reduces body roll and passenger discomfort)
  hasAirConditioning: boolean; // increases fare bonus
}

export interface JourneyRecord {
  id: string;
  routeId: string;
  routeName: string;
  completedAt: string;
  distanceKm: number;
  fareCollected: number;
  onTimeBonus: number;
  speedingFines: number;
  fuelCost: number;
  repairCost: number;
  latePenalty: number;
  finalProfit: number;
  rating: DrivingRating;
}

export interface PlayerProfile {
  money: number;
  selectedBusId: string;
  ownedBusIds: string[];
  upgrades: Record<string, BusUpgrades>; // keyed by busId
  unlockedRouteIds: string[];
  history: JourneyRecord[];
  soundVolume: {
    master: number;
    engine: number;
    horn: number;
    ambience: number;
  };
  hasSeenTutorial: boolean;
}

export interface ActiveJourney {
  route: RouteInfo;
  bus: BusModelConfig;
  status:
    | 'STAND_BOARDING'
    | 'READY_DEPART'
    | 'DRIVING'
    | 'PETROL_BUNK'
    | 'PUNCTURE'
    | 'ARRIVED'
    | 'SUMMARY';
  passengers: number; // 0 to 40
  maxPassengers: number;
  fareCollected: number;
  speedKmh: number;
  rpm: number;
  gear: number;
  distanceCoveredKm: number;
  departureGameTime: string;
  currentGameTime: string;
  estimatedArrivalGameTime: string;
  elapsedSeconds: number;
  fuelLitres: number;
  fuelMaxLitres: number;
  tyreHealth: number; // 0 to 100
  engineTemp: number; // 75 - 100 C
  speedWarningActive: boolean;
  policeWarningActive: boolean;
  criticalWarningActive: boolean;
  totalFines: number;
  totalFuelCost: number;
  totalRepairCost: number;
  cameraView: CameraView;
  weather: WeatherType;
  headlightsOn: boolean;
  wipersOn: boolean;
  activeHazard: 'none' | 'nail' | 'pothole';
}

export const TAMIL_NADU_ROUTES: RouteInfo[] = [
  {
    id: 'chennai-villupuram',
    name: 'Chennai → Villupuram',
    tamilName: 'சென்னை ➔ விழுப்புரம்',
    destination: 'Villupuram',
    tamilDestination: 'விழுப்புரம்',
    distanceKm: 150,
    durationMins: 180,
    farePerPassenger: 200,
    difficulty: 'Easy',
    coastal: false,
    description: 'The golden corridor of GST Road (NH 45). Smooth 4-lane highway through Tambaram, Chengalpattu, and Tindivanam.',
    highlights: ['CMBT Koyambedu', 'Chengalpattu Lake', 'Tindivanam Highway Hub', 'Villupuram Junction'],
  },
  {
    id: 'chennai-cuddalore',
    name: 'Chennai → Cuddalore',
    tamilName: 'சென்னை ➔ கடலூர்',
    destination: 'Cuddalore',
    tamilDestination: 'கடலூர்',
    distanceKm: 190,
    durationMins: 220,
    farePerPassenger: 260,
    difficulty: 'Medium',
    coastal: true,
    description: 'Scenic journey down the Coromandel coast past Puducherry backwaters and Silver Beach palms.',
    highlights: ['East Coast Road', 'Salt Pans', 'Puducherry Bypass', 'Silver Beach Horizon'],
  },
  {
    id: 'chennai-chidambaram',
    name: 'Chennai → Chidambaram',
    tamilName: 'சென்னை ➔ சிதம்பரம்',
    destination: 'Chidambaram',
    tamilDestination: 'சிதம்பரம்',
    distanceKm: 230,
    durationMins: 260,
    farePerPassenger: 320,
    difficulty: 'Medium',
    coastal: true,
    description: 'Ancient temple city route through lush cashew plantations and Kollidam river delta bridges.',
    highlights: ['Kollidam River Bridge', 'Cashew Groves', 'Pichavaram Mangrove Air', 'Temple Gopuram View'],
  },
  {
    id: 'chennai-sirkazhi',
    name: 'Chennai → Sirkazhi',
    tamilName: 'சென்னை ➔ சீர்காழி',
    destination: 'Sirkazhi',
    tamilDestination: 'சீர்காழி',
    distanceKm: 250,
    durationMins: 285,
    farePerPassenger: 360,
    difficulty: 'Medium',
    coastal: false,
    description: 'Vibrant Kaveri Delta gateway with sprawling paddy fields, canal crossings, and lively village bazaars.',
    highlights: ['Delta Waterways', 'Lush Green Paddy', 'Roadside Tender Coconut Bunks', 'Brahmapureeswarar View'],
  },
  {
    id: 'chennai-mayiladuthurai',
    name: 'Chennai → Mayiladuthurai (Mayavaram)',
    tamilName: 'சென்னை ➔ மயிலாடுதுறை',
    destination: 'Mayiladuthurai',
    tamilDestination: 'மயிலாடுதுறை',
    distanceKm: 275,
    durationMins: 310,
    farePerPassenger: 400,
    difficulty: 'Challenging',
    coastal: false,
    description: 'Historic cultural corridor with winding delta bridges, busy town bypasses, and sacred temple arches.',
    highlights: ['Kaveri Banks', 'Heritage Agraharams', 'Bustling Bazaars', 'Delta Twilight Glow'],
  },
  {
    id: 'chennai-kumbakonam',
    name: 'Chennai → Kumbakonam',
    tamilName: 'சென்னை ➔ கும்பகோணம்',
    destination: 'Kumbakonam',
    tamilDestination: 'கும்பகோணம்',
    distanceKm: 290,
    durationMins: 330,
    farePerPassenger: 440,
    difficulty: 'Challenging',
    coastal: false,
    description: 'The City of Temples route. Rich cultural landscape, famous Kumbakonam Degree Coffee stalls, and winding roads.',
    highlights: ['Mahamaham Tank Town', 'Filter Coffee Stalls', 'Brass Lamp Workshops', 'Royal Heritage Arches'],
  },
  {
    id: 'chennai-nagapattinam',
    name: 'Chennai → Nagapattinam',
    tamilName: 'சென்னை ➔ நாகப்பட்டினம்',
    destination: 'Nagapattinam',
    tamilDestination: 'நாகப்பட்டினம்',
    distanceKm: 320,
    durationMins: 360,
    farePerPassenger: 500,
    difficulty: 'Challenging',
    coastal: true,
    description: 'The ultimate Bay of Bengal coastal highway expedition! Stunning sea breeze, fishing harbors, and sweeping vistas.',
    highlights: ['Bay of Bengal Coastline', 'Fishing Catamarans', 'Lighthouse View', 'Velankanni Coastal Strip'],
  },
];

export const BUS_MODELS: BusModelConfig[] = [
  {
    id: 'tnstc-express',
    name: 'TNSTC Express (Classic)',
    tamilName: 'அரசு விரைவுப் போக்குவரத்து',
    description: 'The legendary Tamil Nadu State Transport Corporation workhorse. Renowned emerald green and white livery with rock-solid durability.',
    price: 0,
    unlocked: true,
    topSpeed: 88,
    acceleration: 0.65,
    handling: 0.7,
    fuelCapacity: 120,
    fuelEfficiencyKmPerL: 4.2,
    bodyColor: '#059669', // Emerald green
    stripeColor: '#f8fafc', // Clean white
    roofColor: '#f1f5f9',
    typeBadge: 'TNSTC EXPRESS',
  },
  {
    id: 'setc-deluxe',
    name: 'SETC Ultra Deluxe Coach',
    tamilName: 'அரசு அதிநவீன பேருந்து',
    description: 'State Express Transport Corporation premium highway coach. Striking royal blue & gold trim, air suspension, and enhanced cruising comfort.',
    price: 15000,
    unlocked: false,
    topSpeed: 90,
    acceleration: 0.8,
    handling: 0.82,
    fuelCapacity: 150,
    fuelEfficiencyKmPerL: 4.8,
    bodyColor: '#1d4ed8', // Royal Blue
    stripeColor: '#facc15', // Gold yellow
    roofColor: '#e2e8f0',
    typeBadge: 'SETC ULTRA DELUXE',
  },
  {
    id: 'tamilnadu-sleeper',
    name: 'Kaveri AC Multi-Axle Luxury',
    tamilName: 'காவேரி குளிர்சாதன பேருந்து',
    description: 'Top-tier Tamil Nadu intercity luxury coach. Features whisper-quiet engine, dual rear axles, aerodynamic streamline body, and superior mileage.',
    price: 35000,
    unlocked: false,
    topSpeed: 90,
    acceleration: 0.92,
    handling: 0.9,
    fuelCapacity: 180,
    fuelEfficiencyKmPerL: 5.5,
    bodyColor: '#0f172a', // Midnight slate & crimson
    stripeColor: '#ef4444', // Crimson red
    roofColor: '#334155',
    typeBadge: 'KAVERI AC LUXURY',
  },
];

export const DEFAULT_UPGRADES: BusUpgrades = {
  engineLevel: 1,
  tyreLevel: 1,
  brakeLevel: 1,
  fuelTankLevel: 1,
  suspensionLevel: 1,
  hasAirConditioning: false,
};
