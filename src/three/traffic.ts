import * as THREE from 'three';

export interface TrafficVehicle {
  group: THREE.Group;
  type: 'truck' | 'car' | 'auto' | 'bus';
  name: string;
  baseSpeedMs: number;
  currentSpeedMs: number;
  laneX: number;
  originalLaneX: number;
  length: number;
  width: number;
  isForward: boolean;
  isOvertaking: boolean;
  isWaitingBehindBus: boolean;
  overtakeCooldown: number;
  brakeLights?: THREE.Mesh[];
}

export interface RoadHazard {
  group: THREE.Group;
  type: 'nail' | 'debris';
  x: number;
  z: number;
  active: boolean;
}

export interface CollisionEvent {
  vehicle: TrafficVehicle;
  impactX: number;
  impactZ: number;
  isSevere: boolean;
}

export interface TrafficRig {
  group: THREE.Group;
  vehicles: TrafficVehicle[];
  hazards: RoadHazard[];
  update: (
    dt: number,
    busZ: number,
    busX: number,
    busSpeedMs: number
  ) => {
    hitHazard: RoadHazard | null;
    collision: CollisionEvent | null;
    busBlockedByVehicle: boolean;
    blockVehicleSpeedMs: number;
    maxAllowedBusZ: number | null;
  };
  onHonk: (busZ: number, busX: number) => void;
}

export function createTrafficSystem(trackLength: number): TrafficRig {
  const group = new THREE.Group();
  group.name = 'HighwayTraffic';

  const vehicles: TrafficVehicle[] = [];
  const hazards: RoadHazard[] = [];

  // Helper: Create Indian Cargo Truck (Ashok Leyland style)
  function createIndianLorry(): { group: THREE.Group; brakeLights: THREE.Mesh[] } {
    const truck = new THREE.Group();
    const brakeLights: THREE.Mesh[] = [];

    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.2, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 })
    );
    cabin.position.set(0, 1.4, 3.2);

    // Windshield
    const ws = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 0.9),
      new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, transmission: 0.8, transparent: true })
    );
    ws.position.set(0, 1.6, 4.46);
    truck.add(cabin, ws);

    // Wooden cargo body with bright yellow/orange Indian truck art
    const cargo = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 2.4, 6.5),
      new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.7 })
    );
    cargo.position.set(0, 1.8, -1.5);
    truck.add(cargo);

    // "HORN PLEASE" rear board
    const boardCanvas = document.createElement('canvas');
    boardCanvas.width = 256;
    boardCanvas.height = 128;
    const bctx = boardCanvas.getContext('2d')!;
    bctx.fillStyle = '#dc2626';
    bctx.fillRect(0, 0, 256, 128);
    bctx.fillStyle = '#fef08a';
    bctx.font = 'bold 32px sans-serif';
    bctx.textAlign = 'center';
    bctx.fillText('HORN PLEASE', 128, 55);
    bctx.fillStyle = '#ffffff';
    bctx.font = 'bold 24px sans-serif';
    bctx.fillText('OK · TATA · TN 04', 128, 95);
    const boardTex = new THREE.CanvasTexture(boardCanvas);
    boardTex.colorSpace = THREE.SRGBColorSpace;
    const rearBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.0),
      new THREE.MeshBasicMaterial({ map: boardTex })
    );
    rearBoard.rotateY(Math.PI);
    rearBoard.position.set(0, 1.5, -4.76);
    truck.add(rearBoard);

    // Rear brake lights
    const brakeMat = new THREE.MeshBasicMaterial({ color: 0x7f1d1d });
    const bLightL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), brakeMat);
    bLightL.position.set(-1.0, 0.8, -4.77);
    const bLightR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), brakeMat);
    bLightR.position.set(1.0, 0.8, -4.77);
    truck.add(bLightL, bLightR);
    brakeLights.push(bLightL, bLightR);

    // Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 16);
    wheelGeom.rotateZ(Math.PI * 0.5);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    [-3.8, -1.8, 3.2].forEach((zPos) => {
      const wL = new THREE.Mesh(wheelGeom, wheelMat);
      wL.position.set(-1.25, 0.48, zPos);
      const wR = new THREE.Mesh(wheelGeom, wheelMat);
      wR.position.set(1.25, 0.48, zPos);
      truck.add(wL, wR);
    });

    return { group: truck, brakeLights };
  }

  // Helper: Create Indian Car (White Sedan)
  function createCar(): { group: THREE.Group; brakeLights: THREE.Mesh[] } {
    const car = new THREE.Group();
    const brakeLights: THREE.Mesh[] = [];

    // Lower body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.6, 4.2),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.2 })
    );
    body.position.y = 0.55;

    // Roof & cabin
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.55, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
    );
    roof.position.set(0, 1.05, -0.2);

    // Rear brake lights
    const brakeMat = new THREE.MeshBasicMaterial({ color: 0x7f1d1d });
    const bLightL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.05), brakeMat);
    bLightL.position.set(-0.75, 0.65, -2.11);
    const bLightR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.05), brakeMat);
    bLightR.position.set(0.75, 0.65, -2.11);
    car.add(bLightL, bLightR);
    brakeLights.push(bLightL, bLightR);

    // Wheels
    const wGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
    wGeom.rotateZ(Math.PI * 0.5);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    [-1.2, 1.2].forEach((z) => {
      const wL = new THREE.Mesh(wGeom, wMat);
      wL.position.set(-0.9, 0.32, z);
      const wR = new THREE.Mesh(wGeom, wMat);
      wR.position.set(0.9, 0.32, z);
      car.add(wL, wR);
    });

    car.add(body, roof);
    return { group: car, brakeLights };
  }

  // Helper: Create Auto-Rickshaw
  function createAutoRickshaw(): { group: THREE.Group; brakeLights: THREE.Mesh[] } {
    const auto = new THREE.Group();
    const brakeLights: THREE.Mesh[] = [];

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.7, 2.4),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 })
    );
    body.position.y = 0.55;

    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.8, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 })
    );
    hood.position.set(0, 1.15, -0.2);

    const brakeMat = new THREE.MeshBasicMaterial({ color: 0x7f1d1d });
    const bLight = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.05), brakeMat);
    bLight.position.set(0, 0.65, -1.21);
    auto.add(bLight);
    brakeLights.push(bLight);

    const wGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.15, 12);
    wGeom.rotateZ(Math.PI * 0.5);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

    const frontWheel = new THREE.Mesh(wGeom, wMat);
    frontWheel.position.set(0, 0.24, 0.9);

    const rearL = new THREE.Mesh(wGeom, wMat);
    rearL.position.set(-0.6, 0.24, -0.7);
    const rearR = new THREE.Mesh(wGeom, wMat);
    rearR.position.set(0.6, 0.24, -0.7);

    auto.add(body, hood, frontWheel, rearL, rearR);
    return { group: auto, brakeLights };
  }

  // Highway Lanes:
  // Forward lanes: 2.2 and 5.5
  // Oncoming lanes: -2.2 and -5.5
  const forwardLanes = [2.2, 5.5];
  const oncomingLanes = [-2.2, -5.5];

  for (let z = 120; z < trackLength - 100; z += 150) {
    // 1. Forward vehicle
    const typeChoice = Math.random();
    let vehicleMesh: THREE.Group;
    let brakeLights: THREE.Mesh[] = [];
    let vType: 'truck' | 'car' | 'auto' | 'bus';
    let name = 'Car';
    let length = 4.2;
    let width = 1.9;
    let speedMs = 14 + Math.random() * 4;

    if (typeChoice < 0.45) {
      const res = createIndianLorry();
      vehicleMesh = res.group;
      brakeLights = res.brakeLights;
      vType = 'truck';
      name = 'Cargo Lorry';
      length = 9.5;
      width = 2.5;
      speedMs = 11 + Math.random() * 4;
    } else if (typeChoice < 0.78) {
      const res = createCar();
      vehicleMesh = res.group;
      brakeLights = res.brakeLights;
      vType = 'car';
      name = 'Highway Taxi';
      length = 4.2;
      width = 1.8;
      speedMs = 16 + Math.random() * 4;
    } else {
      const res = createAutoRickshaw();
      vehicleMesh = res.group;
      brakeLights = res.brakeLights;
      vType = 'auto';
      name = 'Auto Rickshaw';
      length = 2.6;
      width = 1.4;
      speedMs = 10 + Math.random() * 3;
    }

    const forwardLane = forwardLanes[Math.floor(Math.random() * forwardLanes.length)];
    vehicleMesh.position.set(forwardLane, 0, z + Math.random() * 40);
    group.add(vehicleMesh);

    vehicles.push({
      group: vehicleMesh,
      type: vType,
      name,
      baseSpeedMs: speedMs,
      currentSpeedMs: speedMs,
      laneX: forwardLane,
      originalLaneX: forwardLane,
      length,
      width,
      isForward: true,
      isOvertaking: false,
      isWaitingBehindBus: false,
      overtakeCooldown: 0,
      brakeLights,
    });

    // 2. Oncoming vehicle
    const oncomingChoice = Math.random() > 0.5 ? createIndianLorry() : createCar();
    const oncomingMesh = oncomingChoice.group;
    oncomingMesh.rotateY(Math.PI);
    const oncomingLane = oncomingLanes[Math.floor(Math.random() * oncomingLanes.length)];
    oncomingMesh.position.set(oncomingLane, 0, z + 75 + Math.random() * 50);
    group.add(oncomingMesh);

    vehicles.push({
      group: oncomingMesh,
      type: 'truck',
      name: 'Oncoming Vehicle',
      baseSpeedMs: -(16 + Math.random() * 6),
      currentSpeedMs: -(16 + Math.random() * 6),
      laneX: oncomingLane,
      originalLaneX: oncomingLane,
      length: 6.0,
      width: 2.2,
      isForward: false,
      isOvertaking: false,
      isWaitingBehindBus: false,
      overtakeCooldown: 0,
    });
  }

  // Hazards (Nails/debris)
  const hazardZList = [850, 2150];
  hazardZList.forEach((hz) => {
    const hGroup = new THREE.Group();
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.9 });
    for (let i = 0; i < 5; i++) {
      const nail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), spikeMat);
      nail.position.set((Math.random() - 0.5) * 0.6, 0.17, (Math.random() - 0.5) * 0.6);
      nail.rotation.x = (Math.random() - 0.5) * 0.4;
      hGroup.add(nail);
    }
    const lane = Math.random() > 0.5 ? 2.4 : 5.2;
    hGroup.position.set(lane, 0, hz);
    group.add(hGroup);

    hazards.push({
      group: hGroup,
      type: 'nail',
      x: lane,
      z: hz,
      active: true,
    });
  });

  const onHonk = (busZ: number, busX: number) => {
    vehicles.forEach((v) => {
      if (v.isForward) {
        const distZ = v.group.position.z - busZ;
        if (distZ > 4 && distZ < 75) {
          if (Math.abs(v.group.position.x - busX) < 2.6) {
            v.laneX = 5.8;
            v.originalLaneX = 5.8;
          }
        }
      }
    });
  };

  const isLaneClear = (targetLaneX: number, minZ: number, maxZ: number, excludeVehicle: TrafficVehicle): boolean => {
    for (const other of vehicles) {
      if (other === excludeVehicle) continue;
      if (Math.abs(other.group.position.x - targetLaneX) < 1.6) {
        const otherFront = other.group.position.z + other.length * 0.5;
        const otherRear = other.group.position.z - other.length * 0.5;
        if (otherFront >= minZ && otherRear <= maxZ) {
          return false;
        }
      }
    }
    return true;
  };

  const update = (
    dt: number,
    busZ: number,
    busX: number,
    busSpeedMs: number
  ) => {
    let hitHazard: RoadHazard | null = null;
    let collision: CollisionEvent | null = null;
    let busBlockedByVehicle = false;
    let blockVehicleSpeedMs = 0;
    let maxAllowedBusZ: number | null = null;

    // Bus physical dimensions
    const busLength = 11.2;
    const busHalfL = 5.6;
    const busHalfW = 1.35;
    const busRearZ = busZ - busHalfL;
    const busFrontZ = busZ + busHalfL;
    const safeFollowGap = 4.0; // Distance to keep behind bus

    // 1. Advance and control traffic AI
    vehicles.forEach((v) => {
      v.overtakeCooldown = Math.max(0, v.overtakeCooldown - dt);

      if (v.isForward) {
        const vFront = v.group.position.z + v.length * 0.5;
        const vRear = v.group.position.z - v.length * 0.5;
        const lateralDist = Math.abs(v.group.position.x - busX);
        const inBusLane = lateralDist < (busHalfW + v.width * 0.5 + 0.4);

        // A. VEHICLE IS BEHIND THE BUS (Approaching from behind)
        if (vFront <= busRearZ + 0.5 && busRearZ - vFront < 45) {
          const distToBus = busRearZ - vFront;

          if (inBusLane) {
            const alternateLane = v.laneX > 3.8 ? 2.2 : 5.5;
            const laneClear = isLaneClear(alternateLane, vRear - 10, busFrontZ + 25, v);
            const busNotInAlt = Math.abs(busX - alternateLane) > 1.8;

            if (laneClear && busNotInAlt && v.overtakeCooldown <= 0) {
              // OVERTAKE!
              v.isOvertaking = true;
              v.isWaitingBehindBus = false;
              v.laneX = alternateLane;
              v.currentSpeedMs = Math.max(v.baseSpeedMs, busSpeedMs + 4.5);
            } else {
              // MUST WAIT BEHIND BUS!
              v.isWaitingBehindBus = true;

              // Match bus speed or stop if bus is stopped
              const targetSpeed = busSpeedMs <= 0.5 ? 0 : Math.max(0, busSpeedMs - 0.5);
              v.currentSpeedMs = THREE.MathUtils.damp(v.currentSpeedMs, targetSpeed, 8.0, dt);

              // Hard-clamp so it NEVER passes through the bus rear!
              const clampZ = busRearZ - safeFollowGap - v.length * 0.5;
              if (v.group.position.z >= clampZ) {
                v.group.position.z = clampZ;
                if (busSpeedMs <= 0.2) {
                  v.currentSpeedMs = 0;
                }
              }
            }
          } else {
            // In adjacent lane overtaking
            v.isWaitingBehindBus = false;
            v.currentSpeedMs = THREE.MathUtils.damp(v.currentSpeedMs, v.baseSpeedMs * 1.15, 3.0, dt);
          }
        }
        // B. VEHICLE IS ALONGSIDE THE BUS (Passing / Overtaking)
        else if (vRear < busFrontZ + 3 && vFront > busRearZ - 3) {
          v.isWaitingBehindBus = false;
          // Keep safe lateral separation
          if (lateralDist < 2.4) {
            v.group.position.x += v.group.position.x > busX ? dt * 2.0 : -dt * 2.0;
          }
          v.currentSpeedMs = Math.max(v.currentSpeedMs, busSpeedMs + 3.0);
        }
        // C. VEHICLE HAS PASSED THE BUS
        else if (vRear >= busFrontZ + 12) {
          if (v.isOvertaking) {
            v.isOvertaking = false;
            v.overtakeCooldown = 8.0;
            if (isLaneClear(v.originalLaneX, vRear - 10, vFront + 15, v)) {
              v.laneX = v.originalLaneX;
            }
          }
          v.isWaitingBehindBus = false;
          v.currentSpeedMs = THREE.MathUtils.damp(v.currentSpeedMs, v.baseSpeedMs, 2.0, dt);
        }
        // D. VEHICLE IS IN FRONT OF BUS (Player bus approaching vehicle)
        else if (vRear > busFrontZ && vRear - busFrontZ < 30) {
          const distFromFront = vRear - busFrontZ;
          if (inBusLane) {
            if (distFromFront < 1.5) {
              busBlockedByVehicle = true;
              blockVehicleSpeedMs = v.currentSpeedMs;
              maxAllowedBusZ = vRear - busHalfL - 0.4;
            }
          }
        }

        // Brake lights
        if (v.brakeLights && v.brakeLights.length > 0) {
          const isBraking = v.isWaitingBehindBus || v.currentSpeedMs < v.baseSpeedMs * 0.7;
          v.brakeLights.forEach((bl) => {
            (bl.material as THREE.MeshBasicMaterial).color.setHex(isBraking ? 0xef4444 : 0x7f1d1d);
          });
        }

        // Advance vehicle in Z
        v.group.position.z += v.currentSpeedMs * dt;
        v.group.position.x = THREE.MathUtils.damp(v.group.position.x, v.laneX, 3.5, dt);

        // Recycle forward vehicles
        if (v.group.position.z < busZ - 120) {
          v.group.position.z = busZ + 260 + Math.random() * 80;
          v.laneX = forwardLanes[Math.floor(Math.random() * forwardLanes.length)];
          v.originalLaneX = v.laneX;
          v.isOvertaking = false;
          v.isWaitingBehindBus = false;
        } else if (v.group.position.z > busZ + 380) {
          v.group.position.z = busZ - 60;
          v.isOvertaking = false;
          v.isWaitingBehindBus = false;
        }
      } else {
        // Oncoming traffic advances in -Z
        v.group.position.z += v.baseSpeedMs * dt;
        if (v.group.position.z < busZ - 100) {
          v.group.position.z = busZ + 320 + Math.random() * 80;
        }
      }

      // ===============================================================
      // 2. HARD SOLID COLLIDER (Zero Transparency - 100% Opaque Solid!)
      // ===============================================================
      const vHalfW = v.width * 0.5;
      const vHalfL = v.length * 0.5;

      const dx = v.group.position.x - busX;
      const dz = v.group.position.z - busZ;
      const overlapX = (busHalfW + vHalfW) - Math.abs(dx);
      const overlapZ = (busHalfL + vHalfL) - Math.abs(dz);

      if (overlapX > 0 && overlapZ > 0) {
        // SOLID PENETRATION DETECTED!
        // Immediately push out to surface (no passing through allowed!)
        if (overlapX < overlapZ) {
          // Side collision: push laterally out
          const signX = dx >= 0 ? 1 : -1;
          v.group.position.x += signX * overlapX;
          v.laneX = v.group.position.x;
        } else {
          // Front/rear collision: push along Z
          const signZ = dz >= 0 ? 1 : -1;
          v.group.position.z += signZ * overlapZ;
          if (signZ < 0) {
            // Vehicle was behind bus: clamp speed to bus speed
            v.currentSpeedMs = Math.min(v.currentSpeedMs, busSpeedMs);
          } else {
            // Vehicle was in front of bus: clamp bus forward motion
            busBlockedByVehicle = true;
            blockVehicleSpeedMs = v.currentSpeedMs;
            maxAllowedBusZ = v.group.position.z - vHalfL - busHalfL - 0.2;
          }
        }

        // Generate Collision Event for damage fine and spark graphics!
        if (!collision) {
          collision = {
            vehicle: v,
            impactX: busX + (dx > 0 ? busHalfW : -busHalfW),
            impactZ: busZ + (dz > 0 ? 3.5 : -3.5),
            isSevere: Math.abs(v.currentSpeedMs - busSpeedMs) > 6 || !v.isForward,
          };
        }
      }
    });

    // 3. Hazards collision
    hazards.forEach((h) => {
      if (h.active) {
        const dx = Math.abs(busX - h.x);
        const dz = Math.abs(busZ - h.z);
        if (dx < 1.4 && dz < 2.0) {
          h.active = false;
          h.group.visible = false;
          hitHazard = h;
        }
      }
    });

    return {
      hitHazard,
      collision,
      busBlockedByVehicle,
      blockVehicleSpeedMs,
      maxAllowedBusZ,
    };
  };

  return {
    group,
    vehicles,
    hazards,
    update,
    onHonk,
  };
}
