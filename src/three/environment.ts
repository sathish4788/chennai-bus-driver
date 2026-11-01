import * as THREE from 'three';
import { RouteInfo, WeatherType } from '../types/game';
import {
  createAsphaltTexture,
  createCMBTBannerTexture,
  createMilestoneTexture,
  createSpeedLimitSignTexture,
  createTeaStallTexture,
  createPetrolBunkTexture,
} from './materials';

export interface EnvironmentRig {
  group: THREE.Group;
  update: (busZ: number, dt: number, weather: WeatherType) => void;
  petrolBunkZ: number;
  policeZ: number;
  destinationStandZ: number;
  isNearPetrolBunk: (busZ: number, busX: number) => boolean;
  isNearPolice: (busZ: number) => boolean;
  isNearDestination: (busZ: number) => boolean;
  passengerSprites: THREE.Group[];
  startBoardingAnimation: (onComplete: () => void) => void;
  startAlightingAnimation: (onComplete: () => void) => void;
}

export function createTamilNaduEnvironment(route: RouteInfo): EnvironmentRig {
  const group = new THREE.Group();
  group.name = 'TamilNaduEnvironment';

  // Total journey virtual track length in meters (scaled for engaging 4-8 min gameplay)
  // 1 game meter = scaled progress
  const trackLength = 3200; // 3.2 km track represents the 150-320 km route
  const petrolBunkZ = 1200; // Petrol bunk at ~40% journey
  const policeZ = 2000; // Police speed checkpoint at ~65% journey
  const destinationStandZ = 2950; // Destination terminus

  // 1. TERRAIN / GROUND (Green Tamil Nadu landscape & coastal sand)
  const groundGeom = new THREE.PlaneGeometry(350, trackLength + 600, 32, 128);
  groundGeom.rotateX(-Math.PI * 0.5);

  const groundMat = new THREE.MeshStandardMaterial({
    color: route.coastal ? 0x22c55e : 0x15803d,
    roughness: 0.9,
    metalness: 0.05,
  });

  const groundMesh = new THREE.Mesh(groundGeom, groundMat);
  groundMesh.position.set(0, -0.05, trackLength * 0.5);
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // 2. COASTAL OCEAN & BEACH (If coastal or scenic delta)
  let seaMesh: THREE.Mesh | null = null;
  if (route.coastal) {
    const seaGeom = new THREE.PlaneGeometry(250, trackLength + 600);
    seaGeom.rotateX(-Math.PI * 0.5);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant Bay of Bengal blue
      roughness: 0.2,
      metalness: 0.3,
    });
    seaMesh = new THREE.Mesh(seaGeom, seaMat);
    seaMesh.position.set(150, -0.2, trackLength * 0.5);
    group.add(seaMesh);

    // Sandy beach strip along ocean edge
    const beachGeom = new THREE.PlaneGeometry(35, trackLength + 600);
    beachGeom.rotateX(-Math.PI * 0.5);
    const beachMat = new THREE.MeshStandardMaterial({
      color: 0xfde047, // Golden sand
      roughness: 0.95,
    });
    const beach = new THREE.Mesh(beachGeom, beachMat);
    beach.position.set(35, -0.02, trackLength * 0.5);
    group.add(beach);
  }

  // 3. 4-LANE DIVIDED HIGHWAY
  const roadWidth = 18; // 4 lanes + shoulders
  const roadGeom = new THREE.PlaneGeometry(roadWidth, trackLength + 600);
  roadGeom.rotateX(-Math.PI * 0.5);

  const asphaltTex = createAsphaltTexture();
  asphaltTex.repeat.set(1, Math.round((trackLength + 600) / 40));

  const roadMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.65,
    metalness: 0.1,
  });

  const roadMesh = new THREE.Mesh(roadGeom, roadMat);
  roadMesh.position.set(0, 0, trackLength * 0.5);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // Highway Concrete Median Barrier (Divider between lanes)
  const medianGeom = new THREE.BoxGeometry(0.8, 0.6, trackLength + 600);
  const medianMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.8,
  });
  const median = new THREE.Mesh(medianGeom, medianMat);
  median.position.set(0, 0.3, trackLength * 0.5);
  median.castShadow = true;
  group.add(median);

  // 4. CHENNAI CMBT TERMINUS (Starting Bus Stand at z: 0 to 60)
  const cmbtGroup = new THREE.Group();
  cmbtGroup.position.set(0, 0, 0);

  // Passenger boarding platform
  const platformGeom = new THREE.BoxGeometry(12, 0.4, 45);
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const platform = new THREE.Mesh(platformGeom, platformMat);
  platform.position.set(12, 0.2, 15);
  cmbtGroup.add(platform);

  // Platform roof shelter with pillars
  const shelterRoofGeom = new THREE.BoxGeometry(14, 0.25, 48);
  const shelterRoof = new THREE.Mesh(shelterRoofGeom, new THREE.MeshStandardMaterial({ color: 0x065f46 }));
  shelterRoof.position.set(12, 4.2, 15);
  cmbtGroup.add(shelterRoof);

  // Support pillars
  for (let z = 0; z <= 30; z += 10) {
    const pillarGeom = new THREE.CylinderGeometry(0.18, 0.18, 4.0, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
    const p1 = new THREE.Mesh(pillarGeom, pillarMat);
    p1.position.set(7, 2.1, z);
    const p2 = new THREE.Mesh(pillarGeom, pillarMat);
    p2.position.set(17, 2.1, z);
    cmbtGroup.add(p1, p2);
  }

  // Large CMBT Banner
  const cmbtTex = createCMBTBannerTexture();
  const cmbtBannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 4),
    new THREE.MeshBasicMaterial({ map: cmbtTex })
  );
  cmbtBannerMesh.position.set(12, 6.2, 15);
  cmbtGroup.add(cmbtBannerMesh);

  group.add(cmbtGroup);

  // 5. ANIMATED PASSENGERS AT BUS STAND
  const passengerSprites: THREE.Group[] = [];
  const passengerColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0xf97316];

  for (let i = 0; i < 40; i++) {
    const pGroup = new THREE.Group();
    // Body / Kurta / Shirt
    const color = passengerColors[i % passengerColors.length];
    const bodyMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 0.9, 10),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
    );
    bodyMesh.position.y = 0.85;

    // Head
    const headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }) // South Indian skin tone
    );
    headMesh.position.y = 1.45;

    // Luggage / Handbag
    const bagMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.28, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
    );
    bagMesh.position.set(0.22, 0.6, 0);

    pGroup.add(bodyMesh, headMesh, bagMesh);

    // Initial waiting positions scattered on platform
    const px = 7.5 + Math.random() * 4.5;
    const pz = 5 + Math.random() * 25;
    pGroup.position.set(px, 0.4, pz);

    passengerSprites.push(pGroup);
    cmbtGroup.add(pGroup);
  }

  // 6. PROCEDURAL VEGETATION (Coconut palms, Banyan trees, Roadside bushes)
  // Low-poly Coconut Palm generator
  function createCoconutPalm(): THREE.Group {
    const palm = new THREE.Group();
    // Curved trunk
    const trunkGeom = new THREE.CylinderGeometry(0.16, 0.28, 6.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 3.2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    palm.add(trunk);

    // Palm fronds
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    for (let f = 0; f < 8; f++) {
      const frondGeom = new THREE.ConeGeometry(0.9, 3.2, 5);
      frondGeom.rotateX(Math.PI * 0.35);
      const frond = new THREE.Mesh(frondGeom, frondMat);
      frond.position.set(0, 6.3, 0);
      frond.rotation.y = (f / 8) * Math.PI * 2;
      palm.add(frond);
    }

    // Coconuts
    for (let c = 0; c < 3; c++) {
      const nut = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x854d0e })
      );
      nut.position.set(Math.cos(c * 2) * 0.2, 6.1, Math.sin(c * 2) * 0.2);
      palm.add(nut);
    }
    return palm;
  }

  // Distribute roadside palm trees along the highway
  for (let z = 60; z < trackLength; z += 35) {
    // Left side palms
    const palmL = createCoconutPalm();
    palmL.position.set(-13 - Math.random() * 8, 0, z + Math.random() * 15);
    const scaleL = 0.85 + Math.random() * 0.35;
    palmL.scale.set(scaleL, scaleL, scaleL);
    group.add(palmL);

    // Right side palms
    const palmR = createCoconutPalm();
    palmR.position.set(13 + Math.random() * 8, 0, z + Math.random() * 15);
    const scaleR = 0.85 + Math.random() * 0.35;
    palmR.scale.set(scaleR, scaleR, scaleR);
    group.add(palmR);
  }

  // 7. ROADSIDE TEA STALLS & HOTELS
  const teaStallZPositions = [450, 1650, 2400];
  const teaStallNames = [
    { name: 'மணி டீ ஸ்டால்', sub: 'Mani Tea Stall & Kumbakonam Coffee' },
    { name: 'அம்மா உணவகம்', sub: 'Amma Canteen - Highway Tiffin' },
    { name: 'காவேரி ஹோட்டல்', sub: 'Kaveri Pure Veg Highway Hotel' },
  ];

  teaStallZPositions.forEach((tz, idx) => {
    const stallInfo = teaStallNames[idx % teaStallNames.length];
    const stallGroup = new THREE.Group();
    stallGroup.position.set(-15, 0, tz);

    // Shop structure
    const shopGeom = new THREE.BoxGeometry(6, 3, 5);
    const shopMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.8 });
    const shop = new THREE.Mesh(shopGeom, shopMat);
    shop.position.y = 1.5;

    // Tin corrugated sloped roof
    const roofGeom = new THREE.ConeGeometry(4.5, 1.2, 4);
    roofGeom.rotateY(Math.PI * 0.25);
    const roof = new THREE.Mesh(roofGeom, new THREE.MeshStandardMaterial({ color: 0x334155 }));
    roof.position.y = 3.6;

    // Signboard
    const signTex = createTeaStallTexture(stallInfo.name, stallInfo.sub);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(0, 2.5, 2.55);

    // Small roadside tea counter and benches
    const bench = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    bench.position.set(0, 0.2, 3.8);

    stallGroup.add(shop, roof, sign, bench);
    group.add(stallGroup);
  });

  // 8. PETROL BUNK (Station at petrolBunkZ)
  const bunkGroup = new THREE.Group();
  bunkGroup.position.set(18, 0, petrolBunkZ);

  // Large canopy over fuel pumps
  const canopyGeom = new THREE.BoxGeometry(16, 0.5, 22);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
  const canopy = new THREE.Mesh(canopyGeom, canopyMat);
  canopy.position.set(0, 5.0, 0);
  bunkGroup.add(canopy);

  // Canopy support columns
  for (let cz = -8; cz <= 8; cz += 8) {
    for (let cx = -5; cx <= 5; cx += 10) {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 5, 12),
        new THREE.MeshStandardMaterial({ color: 0xf97316 })
      );
      col.position.set(cx, 2.5, cz);
      bunkGroup.add(col);
    }
  }

  // Fuel dispenser islands
  for (let fz = -5; fz <= 5; fz += 10) {
    const pumpIsland = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xfacc15 })
    );
    pumpIsland.position.set(0, 1.1, fz);
    bunkGroup.add(pumpIsland);
  }

  // Petrol bunk sign banner
  const bunkBannerTex = createPetrolBunkTexture();
  const bunkSign = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), new THREE.MeshBasicMaterial({ map: bunkBannerTex }));
  bunkSign.position.set(0, 7.2, 0);
  bunkGroup.add(bunkSign);

  // Service lane pavement
  const servicePave = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.1, 30),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
  );
  servicePave.position.set(0, 0.05, 0);
  bunkGroup.add(servicePave);

  group.add(bunkGroup);

  // 9. HIGHWAY MILESTONES & SPEED LIMIT SIGNS
  const milestoneIntervals = [300, 700, 1100, 1500, 1900, 2300, 2700];
  const speedLimitTex = createSpeedLimitSignTexture();

  milestoneIntervals.forEach((mz, i) => {
    // Milestone on left shoulder
    const remainingKm = Math.max(10, Math.round(route.distanceKm * (1 - mz / trackLength)));
    const msTex = createMilestoneTexture(route.tamilDestination, remainingKm);
    const msGeom = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16);
    const msMesh = new THREE.Mesh(msGeom, new THREE.MeshBasicMaterial({ map: msTex }));
    msMesh.position.set(-10, 0.55, mz);
    group.add(msMesh);

    // Speed Limit 90 km/h sign on right shoulder
    const signPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    );
    signPole.position.set(10.5, 1.6, mz + 50);

    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.2),
      new THREE.MeshBasicMaterial({ map: speedLimitTex, transparent: true })
    );
    signBoard.position.set(10.5, 2.7, mz + 50);
    group.add(signPole, signBoard);
  });

  // 10. POLICE HIGHWAY PATROL CHECKPOINT (At policeZ)
  const policeGroup = new THREE.Group();
  policeGroup.position.set(12, 0, policeZ);

  // Police Patrol Vehicle (White Indian SUV/Van)
  const vanBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 1.4, 4.6),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
  );
  vanBody.position.y = 1.0;

  // Blue police stripe
  const policeStripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.12, 0.25, 4.62),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8 })
  );
  policeStripe.position.y = 1.0;

  // Flashing Emergency Beacon Bar
  const beaconBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.15, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  beaconBar.position.y = 1.85;

  // Flashing lights
  const redBeacon = new THREE.PointLight(0xef4444, 2, 20);
  redBeacon.position.set(-0.35, 1.9, 0);
  const blueBeacon = new THREE.PointLight(0x3b82f6, 2, 20);
  blueBeacon.position.set(0.35, 1.9, 0);

  // Police officer checkpoint sign
  const checkpointSignGeom = new THREE.BoxGeometry(2.5, 1.2, 0.1);
  const checkpointSign = new THREE.Mesh(
    checkpointSignGeom,
    new THREE.MeshStandardMaterial({ color: 0xfacc15 })
  );
  checkpointSign.position.set(-2.5, 1.2, 0);

  policeGroup.add(vanBody, policeStripe, beaconBar, redBeacon, blueBeacon, checkpointSign);
  group.add(policeGroup);

  // 11. DESTINATION BUS STAND (At destinationStandZ)
  const destStandGroup = new THREE.Group();
  destStandGroup.position.set(0, 0, destinationStandZ);

  // Arrival platform
  const destPlatform = new THREE.Mesh(platformGeom, platformMat);
  destPlatform.position.set(12, 0.2, 15);

  // Arrival shelter
  const destRoof = new THREE.Mesh(shelterRoofGeom, new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
  destRoof.position.set(12, 4.2, 15);

  // Destination Terminal Sign
  const destSignCanvas = document.createElement('canvas');
  destSignCanvas.width = 1024;
  destSignCanvas.height = 256;
  const dctx = destSignCanvas.getContext('2d')!;
  dctx.fillStyle = '#1e3a8a';
  dctx.fillRect(0, 0, 1024, 256);
  dctx.strokeStyle = '#facc15';
  dctx.lineWidth = 10;
  dctx.strokeRect(6, 6, 1012, 244);
  dctx.fillStyle = '#fef08a';
  dctx.font = 'bold 50px system-ui, sans-serif';
  dctx.textAlign = 'center';
  dctx.textBaseline = 'middle';
  dctx.fillText(`${route.tamilDestination} புதிய பேருந்து நிலையம்`, 512, 75);
  dctx.fillStyle = '#ffffff';
  dctx.font = '900 44px sans-serif';
  dctx.fillText(`${route.destination.toUpperCase()} NEW BUS TERMINUS`, 512, 150);
  dctx.fillStyle = '#4ade80';
  dctx.font = 'bold 26px sans-serif';
  dctx.fillText('★ ARRIVAL PLATFORM · தமிழ்நாடு அரசு விரைவுப் போக்குவரத்து ★', 512, 210);

  const destSignTex = new THREE.CanvasTexture(destSignCanvas);
  destSignTex.colorSpace = THREE.SRGBColorSpace;
  const destSignMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 4),
    new THREE.MeshBasicMaterial({ map: destSignTex })
  );
  destSignMesh.position.set(12, 6.2, 15);

  destStandGroup.add(destPlatform, destRoof, destSignMesh);
  group.add(destStandGroup);

  // Boarding animation
  let isBoarding = false;
  let boardingProgress = 0;
  let boardingCallback: (() => void) | null = null;

  const startBoardingAnimation = (onComplete: () => void) => {
    isBoarding = true;
    boardingProgress = 0;
    boardingCallback = onComplete;
  };

  // Alighting animation
  let isAlighting = false;
  let alightingProgress = 0;
  let alightingCallback: (() => void) | null = null;

  const startAlightingAnimation = (onComplete: () => void) => {
    isAlighting = true;
    alightingProgress = 0;
    alightingCallback = onComplete;
  };

  // Update per frame
  let beaconTime = 0;
  const update = (busZ: number, dt: number, weather: WeatherType) => {
    // 1. Police light beacon rotation / alternate flash
    beaconTime += dt * 8;
    const isRed = Math.floor(beaconTime) % 2 === 0;
    redBeacon.intensity = isRed ? 3.5 : 0.2;
    blueBeacon.intensity = isRed ? 0.2 : 3.5;

    // 2. Animate passengers walking towards bus door during boarding
    if (isBoarding) {
      boardingProgress += dt * 0.35; // ~3 seconds boarding time
      passengerSprites.forEach((p, idx) => {
        // Bus door is around (1.3, 0.4, 4.2)
        const targetX = 1.4;
        const targetZ = 4.2;
        const speed = 1.5 + (idx % 5) * 0.2;

        p.position.x = THREE.MathUtils.damp(p.position.x, targetX, speed, dt);
        p.position.z = THREE.MathUtils.damp(p.position.z, targetZ, speed, dt);

        // Disappear into bus once reached door
        if (Math.abs(p.position.x - targetX) < 0.3 && Math.abs(p.position.z - targetZ) < 0.5) {
          p.visible = false;
        }
      });

      if (boardingProgress >= 1.0) {
        isBoarding = false;
        passengerSprites.forEach((p) => (p.visible = false));
        if (boardingCallback) boardingCallback();
      }
    }

    // 3. Animate passengers stepping out at destination
    if (isAlighting) {
      alightingProgress += dt * 0.4;
      passengerSprites.forEach((p, idx) => {
        p.visible = true;
        // Move from bus door out onto destination platform
        p.position.set(
          1.4 + alightingProgress * 8 + (idx % 4) * 1.2,
          0.4,
          destinationStandZ + 10 + (idx % 6) * 2.5
        );
      });

      if (alightingProgress >= 1.0) {
        isAlighting = false;
        if (alightingCallback) alightingCallback();
      }
    }
  };

  // Helper checks
  const isNearPetrolBunk = (busZ: number, busX: number) => {
    return Math.abs(busZ - petrolBunkZ) < 20 && busX > 4; // Bus has pulled into right-hand service lane
  };

  const isNearPolice = (busZ: number) => {
    return Math.abs(busZ - policeZ) < 40;
  };

  const isNearDestination = (busZ: number) => {
    return busZ >= destinationStandZ - 10;
  };

  return {
    group,
    update,
    petrolBunkZ,
    policeZ,
    destinationStandZ,
    isNearPetrolBunk,
    isNearPolice,
    isNearDestination,
    passengerSprites,
    startBoardingAnimation,
    startAlightingAnimation,
  };
}
