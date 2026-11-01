import * as THREE from 'three';
import { BusModelConfig, RouteInfo } from '../types/game';
import { createDestinationBoardTexture, createDashboardGaugesTexture } from './materials';

export interface BusRig {
  group: THREE.Group;
  busBodyGroup: THREE.Group; // Lean & suspension roll apply to this
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  steeringWheelGroup: THREE.Group;
  dashboardMaterial: THREE.MeshBasicMaterial;
  headlightLeft: THREE.SpotLight;
  headlightRight: THREE.SpotLight;
  headlightLenses: THREE.Mesh[];
  taillightLenses: THREE.Mesh[];
  destinationBoardMesh: THREE.Mesh;
  driverCameraAnchor: THREE.Object3D;
  exteriorCameraAnchor: THREE.Object3D;
  lookAtAnchor: THREE.Object3D;
  update: (
    dt: number,
    speedKmh: number,
    steerInput: number,
    isBraking: boolean,
    headlightsOn: boolean,
    rpm: number,
    fuelFraction: number,
    engineTemp: number
  ) => void;
  updateDestination: (route: RouteInfo, bus: BusModelConfig) => void;
}

export function createProceduralBus(busConfig: BusModelConfig, initialRoute: RouteInfo): BusRig {
  const masterGroup = new THREE.Group();
  masterGroup.name = 'BusRig';

  // Body group pivots on the suspension chassis
  const busBodyGroup = new THREE.Group();
  busBodyGroup.name = 'BusBodyGroup';
  masterGroup.add(busBodyGroup);

  // Colors based on bus model
  const bodyColor = new THREE.Color(busConfig.bodyColor);
  const stripeColor = new THREE.Color(busConfig.stripeColor);
  const darkTrim = new THREE.Color(0x1e293b);
  const chromeColor = new THREE.Color(0xd1d5db);

  // Materials
  const busBodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.35,
    metalness: 0.25,
  });

  const stripeMat = new THREE.MeshStandardMaterial({
    color: stripeColor,
    roughness: 0.4,
    metalness: 0.1,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(busConfig.roofColor),
    roughness: 0.5,
    metalness: 0.05,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: darkTrim,
    roughness: 0.7,
    metalness: 0.2,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: chromeColor,
    roughness: 0.15,
    metalness: 0.9,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    transmission: 0.85,
    opacity: 1,
    transparent: true,
    roughness: 0.05,
    ior: 1.5,
  });

  // Dimensions: Indian Long Passenger Bus ~ 11.5m length, 2.6m width, 3.2m height
  const busLength = 11.2;
  const busWidth = 2.6;
  const busHeight = 2.4;
  const floorY = 0.9;

  // 1. CHASSIS / UNDERCARRIAGE
  const chassisGeom = new THREE.BoxGeometry(busWidth * 0.9, 0.35, busLength * 0.95);
  const chassis = new THREE.Mesh(chassisGeom, darkTrimMat);
  chassis.position.set(0, floorY, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  busBodyGroup.add(chassis);

  // 2. LOWER BODY SKIRT
  const skirtGeom = new THREE.BoxGeometry(busWidth, 0.65, busLength);
  const skirt = new THREE.Mesh(skirtGeom, busBodyMat);
  skirt.position.set(0, floorY + 0.35, 0);
  skirt.castShadow = true;
  busBodyGroup.add(skirt);

  // 3. MAIN PASSENGER CABIN
  const cabinGeom = new THREE.BoxGeometry(busWidth, 1.45, busLength);
  const cabin = new THREE.Mesh(cabinGeom, busBodyMat);
  cabin.position.set(0, floorY + 1.35, 0);
  cabin.castShadow = true;
  busBodyGroup.add(cabin);

  // 4. SIGNATURE TAMIL NADU LIVERY STRIPE
  const stripeGeom = new THREE.BoxGeometry(busWidth + 0.02, 0.3, busLength + 0.02);
  const stripe = new THREE.Mesh(stripeGeom, stripeMat);
  stripe.position.set(0, floorY + 0.72, 0);
  busBodyGroup.add(stripe);

  // 5. CURVED AERODYNAMIC ROOF
  const roofGeom = new THREE.CylinderGeometry(busWidth * 0.52, busWidth * 0.52, busLength, 24, 1, false, 0, Math.PI);
  roofGeom.rotateZ(Math.PI * 0.5);
  roofGeom.rotateX(Math.PI * 0.5);
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.set(0, floorY + 2.05, 0);
  roof.scale.set(1, 0.32, 1);
  roof.castShadow = true;
  busBodyGroup.add(roof);

  // AC Unit on roof if applicable
  const acBoxGeom = new THREE.BoxGeometry(1.6, 0.3, 3.2);
  const acBox = new THREE.Mesh(acBoxGeom, roofMat);
  acBox.position.set(0, floorY + 2.3, -0.5);
  busBodyGroup.add(acBox);

  // 6. FRONT WINDSHIELD (Sloped Indian express bus style)
  const windshieldGeom = new THREE.PlaneGeometry(busWidth * 0.92, 1.25);
  windshieldGeom.rotateX(-0.15); // Slight aerodynamic rake
  const frontWindshield = new THREE.Mesh(windshieldGeom, glassMat);
  frontWindshield.position.set(0, floorY + 1.48, busLength * 0.5 + 0.02);
  busBodyGroup.add(frontWindshield);

  // Windshield center pillar divider
  const pillarGeom = new THREE.BoxGeometry(0.06, 1.3, 0.08);
  const pillar = new THREE.Mesh(pillarGeom, darkTrimMat);
  pillar.position.set(0, floorY + 1.48, busLength * 0.5 + 0.04);
  pillar.rotation.x = -0.15;
  busBodyGroup.add(pillar);

  // Windshield wipers
  const wiperBarGeom = new THREE.BoxGeometry(0.45, 0.03, 0.03);
  const wiperL = new THREE.Mesh(wiperBarGeom, darkTrimMat);
  wiperL.position.set(-0.6, floorY + 1.05, busLength * 0.5 + 0.05);
  wiperL.rotation.z = 0.25;
  const wiperR = new THREE.Mesh(wiperBarGeom, darkTrimMat);
  wiperR.position.set(0.6, floorY + 1.05, busLength * 0.5 + 0.05);
  wiperR.rotation.z = 0.25;
  busBodyGroup.add(wiperL, wiperR);

  // 7. SIDE WINDOWS (Ribbons with passenger silhouettes)
  const sideWindowGeom = new THREE.PlaneGeometry(busLength * 0.78, 0.95);
  const sideWindowLeft = new THREE.Mesh(sideWindowGeom, glassMat);
  sideWindowLeft.rotateY(-Math.PI * 0.5);
  sideWindowLeft.position.set(-busWidth * 0.5 - 0.01, floorY + 1.48, -0.2);

  const sideWindowRight = new THREE.Mesh(sideWindowGeom, glassMat);
  sideWindowRight.rotateY(Math.PI * 0.5);
  sideWindowRight.position.set(busWidth * 0.5 + 0.01, floorY + 1.48, -0.2);

  busBodyGroup.add(sideWindowLeft, sideWindowRight);

  // Rear Window
  const rearWindowGeom = new THREE.PlaneGeometry(busWidth * 0.8, 0.85);
  const rearWindow = new THREE.Mesh(rearWindowGeom, glassMat);
  rearWindow.rotateY(Math.PI);
  rearWindow.position.set(0, floorY + 1.5, -busLength * 0.5 - 0.01);
  busBodyGroup.add(rearWindow);

  // 8. PASSENGER ENTRANCE DOOR (Front Left in Indian RHD buses)
  const doorGeom = new THREE.BoxGeometry(0.04, 1.7, 0.85);
  const door = new THREE.Mesh(doorGeom, darkTrimMat);
  door.position.set(busWidth * 0.5 + 0.01, floorY + 0.9, busLength * 0.38);
  busBodyGroup.add(door);

  // 9. DYNAMIC TAMIL NADU LED DESTINATION BOARD
  let destTexture = createDestinationBoardTexture(
    initialRoute.tamilDestination,
    initialRoute.destination,
    busConfig.typeBadge
  );
  const destMat = new THREE.MeshBasicMaterial({ map: destTexture });
  const destGeom = new THREE.PlaneGeometry(2.0, 0.5);
  const destinationBoardMesh = new THREE.Mesh(destGeom, destMat);
  destinationBoardMesh.position.set(0, floorY + 2.2, busLength * 0.5 + 0.04);
  busBodyGroup.add(destinationBoardMesh);

  // 10. FRONT GRILLE & NUMBER PLATE
  const grilleGeom = new THREE.BoxGeometry(1.6, 0.5, 0.08);
  const grille = new THREE.Mesh(grilleGeom, darkTrimMat);
  grille.position.set(0, floorY + 0.45, busLength * 0.5 + 0.02);
  busBodyGroup.add(grille);

  // Chrome bars on grille
  for (let i = -0.15; i <= 0.15; i += 0.1) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.03, 0.04), chromeMat);
    bar.position.set(0, floorY + 0.45 + i, busLength * 0.5 + 0.07);
    busBodyGroup.add(bar);
  }

  // Number plate (Yellow TN 01 N 2026)
  const plateCanvas = document.createElement('canvas');
  plateCanvas.width = 256;
  plateCanvas.height = 64;
  const pctx = plateCanvas.getContext('2d')!;
  pctx.fillStyle = '#facc15';
  pctx.fillRect(0, 0, 256, 64);
  pctx.fillStyle = '#0f172a';
  pctx.font = 'bold 32px monospace';
  pctx.textAlign = 'center';
  pctx.textBaseline = 'middle';
  pctx.fillText('TN 01 N 2026', 128, 32);
  const plateTex = new THREE.CanvasTexture(plateCanvas);
  const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), plateMat);
  plate.position.set(0, floorY + 0.18, busLength * 0.5 + 0.05);
  busBodyGroup.add(plate);

  // 11. HEADLIGHTS & SPOTLIGHTS
  const lensGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16);
  lensGeom.rotateX(Math.PI * 0.5);
  const headlightLensMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const headlightLensL = new THREE.Mesh(lensGeom, headlightLensMat);
  headlightLensL.position.set(-0.95, floorY + 0.45, busLength * 0.5 + 0.04);
  const headlightLensR = new THREE.Mesh(lensGeom, headlightLensMat);
  headlightLensR.position.set(0.95, floorY + 0.45, busLength * 0.5 + 0.04);
  busBodyGroup.add(headlightLensL, headlightLensR);

  // Headlight spot lights casting onto highway
  const spotL = new THREE.SpotLight(0xfffaed, 2.5, 45, Math.PI / 6, 0.4, 1.2);
  spotL.position.set(-0.95, floorY + 0.5, busLength * 0.5 + 0.1);
  const targetL = new THREE.Object3D();
  targetL.position.set(-1.0, 0, busLength * 0.5 + 25);
  masterGroup.add(targetL);
  spotL.target = targetL;

  const spotR = new THREE.SpotLight(0xfffaed, 2.5, 45, Math.PI / 6, 0.4, 1.2);
  spotR.position.set(0.95, floorY + 0.5, busLength * 0.5 + 0.1);
  const targetR = new THREE.Object3D();
  targetR.position.set(1.0, 0, busLength * 0.5 + 25);
  masterGroup.add(targetR);
  spotR.target = targetR;

  busBodyGroup.add(spotL, spotR);

  // 12. TAILLIGHTS (Brake lights)
  const tailLensGeom = new THREE.BoxGeometry(0.2, 0.4, 0.05);
  const tailLensMat = new THREE.MeshBasicMaterial({ color: 0x991b1b }); // Dim red by default
  const tailL = new THREE.Mesh(tailLensGeom, tailLensMat);
  tailL.position.set(-1.05, floorY + 0.65, -busLength * 0.5 - 0.02);
  const tailR = new THREE.Mesh(tailLensGeom, tailLensMat);
  tailR.position.set(1.05, floorY + 0.65, -busLength * 0.5 - 0.02);
  busBodyGroup.add(tailL, tailR);

  // 13. EXTERIOR REARVIEW MIRRORS
  const mirrorGeom = new THREE.BoxGeometry(0.12, 0.35, 0.22);
  const mirrorL = new THREE.Mesh(mirrorGeom, darkTrimMat);
  mirrorL.position.set(-busWidth * 0.5 - 0.25, floorY + 1.6, busLength * 0.5 - 0.4);
  const stalkL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3), darkTrimMat);
  stalkL.rotation.z = Math.PI * 0.5;
  stalkL.position.set(-busWidth * 0.5 - 0.12, floorY + 1.6, busLength * 0.5 - 0.4);

  const mirrorR = new THREE.Mesh(mirrorGeom, darkTrimMat);
  mirrorR.position.set(busWidth * 0.5 + 0.25, floorY + 1.6, busLength * 0.5 - 0.4);
  const stalkR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3), darkTrimMat);
  stalkR.rotation.z = Math.PI * 0.5;
  stalkR.position.set(busWidth * 0.5 + 0.12, floorY + 1.6, busLength * 0.5 - 0.4);

  busBodyGroup.add(mirrorL, stalkL, mirrorR, stalkR);

  // 14. INTERIOR COCKPIT & DASHBOARD
  // Dashboard console
  const dashConsoleGeom = new THREE.BoxGeometry(busWidth * 0.9, 0.55, 0.85);
  const dashConsole = new THREE.Mesh(dashConsoleGeom, darkTrimMat);
  dashConsole.position.set(0, floorY + 0.85, busLength * 0.5 - 0.65);
  busBodyGroup.add(dashConsole);

  // Dashboard instrument cluster display (Speedometer & RPM)
  const dashInitialTexture = createDashboardGaugesTexture(0, 800, 1.0, 85);
  const dashboardMaterial = new THREE.MeshBasicMaterial({ map: dashInitialTexture });
  const gaugePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.38), dashboardMaterial);
  // Positioned right in front of the driver (Right side of bus in India: x = 0.55)
  gaugePlane.position.set(0.55, floorY + 1.15, busLength * 0.5 - 0.85);
  gaugePlane.rotation.x = -0.4;
  busBodyGroup.add(gaugePlane);

  // Steering Column & Rotating Steering Wheel
  const steeringWheelGroup = new THREE.Group();
  steeringWheelGroup.position.set(0.55, floorY + 1.15, busLength * 0.5 - 1.05);
  steeringWheelGroup.rotation.x = -0.45;

  // Steering rim
  const wheelTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.028, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 })
  );
  // Steering spokes
  const spokeGeom = new THREE.BoxGeometry(0.44, 0.03, 0.02);
  const spoke = new THREE.Mesh(spokeGeom, chromeMat);
  const hornPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 })
  );
  hornPad.rotation.x = Math.PI * 0.5;

  steeringWheelGroup.add(wheelTorus, spoke, hornPad);
  busBodyGroup.add(steeringWheelGroup);

  // Driver Seat
  const seatGeom = new THREE.BoxGeometry(0.65, 0.65, 0.65);
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
  const driverSeat = new THREE.Mesh(seatGeom, seatMat);
  driverSeat.position.set(0.55, floorY + 0.6, busLength * 0.5 - 1.6);
  busBodyGroup.add(driverSeat);

  // Interior Passenger Seats (Visible through windows)
  const passSeatGeom = new THREE.BoxGeometry(0.55, 0.6, 0.45);
  const passSeatMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 });
  for (let z = -busLength * 0.35; z <= busLength * 0.2; z += 1.1) {
    const sLeft = new THREE.Mesh(passSeatGeom, passSeatMat);
    sLeft.position.set(-0.85, floorY + 0.7, z);
    const sRight = new THREE.Mesh(passSeatGeom, passSeatMat);
    sRight.position.set(0.85, floorY + 0.7, z);
    busBodyGroup.add(sLeft, sRight);
  }

  // 15. WHEELS & SUSPENSION
  // Tyre helper
  function createTyre(): THREE.Group {
    const wheelGroup = new THREE.Group();
    // Rubber tyre
    const tyreMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.36, 24),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95, metalness: 0.1 })
    );
    tyreMesh.rotation.z = Math.PI * 0.5;
    tyreMesh.castShadow = true;

    // Rim hub
    const rimMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.38, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.8 })
    );
    rimMesh.rotation.z = Math.PI * 0.5;

    // Wheel nuts / details
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), darkTrimMat);
    nut.rotation.z = Math.PI * 0.5;

    wheelGroup.add(tyreMesh, rimMesh, nut);
    return wheelGroup;
  }

  const frontLeftWheel = createTyre();
  frontLeftWheel.position.set(-busWidth * 0.5 + 0.05, 0.5, busLength * 0.32);

  const frontRightWheel = createTyre();
  frontRightWheel.position.set(busWidth * 0.5 - 0.05, 0.5, busLength * 0.32);

  const rearLeftWheel = createTyre();
  rearLeftWheel.position.set(-busWidth * 0.5 + 0.05, 0.5, -busLength * 0.26);

  const rearRightWheel = createTyre();
  rearRightWheel.position.set(busWidth * 0.5 - 0.05, 0.5, -busLength * 0.26);

  masterGroup.add(frontLeftWheel, frontRightWheel, rearLeftWheel, rearRightWheel);

  // 16. CAMERA ANCHOR POINTS
  // Driver Cockpit Camera: seated in driver seat (India RHD: x = 0.55), looking out front windshield
  const driverCameraAnchor = new THREE.Object3D();
  driverCameraAnchor.position.set(0.55, floorY + 1.25, busLength * 0.5 - 1.45);
  busBodyGroup.add(driverCameraAnchor);

  // Exterior Third Person Camera: behind and above
  const exteriorCameraAnchor = new THREE.Object3D();
  exteriorCameraAnchor.position.set(0, 3.8, -busLength * 0.5 - 5.5);
  masterGroup.add(exteriorCameraAnchor);

  // Look-at Target for exterior camera
  const lookAtAnchor = new THREE.Object3D();
  lookAtAnchor.position.set(0, floorY + 0.8, busLength * 0.1);
  masterGroup.add(lookAtAnchor);

  let lastDashUpdate = 0;

  // Master update per frame
  const update = (
    dt: number,
    speedKmh: number,
    steerInput: number,
    isBraking: boolean,
    headlightsOn: boolean,
    rpm: number,
    fuelFraction: number,
    engineTemp: number
  ) => {
    // 1. Wheel rotation proportional to forward speed
    const wheelCircumference = 2 * Math.PI * 0.5; // ~3.14m
    const speedMs = (speedKmh * 1000) / 3600;
    const rotSpeed = (speedMs / wheelCircumference) * dt * Math.PI * 2;

    frontLeftWheel.children[0].rotation.x += rotSpeed;
    frontRightWheel.children[0].rotation.x += rotSpeed;
    rearLeftWheel.children[0].rotation.x += rotSpeed;
    rearRightWheel.children[0].rotation.x += rotSpeed;

    // 2. Front wheel steering angle (steer right turns wheels to the right)
    const maxSteerAngle = 0.45; // ~26 degrees
    const currentSteerAngle = -steerInput * maxSteerAngle;
    frontLeftWheel.rotation.y = currentSteerAngle;
    frontRightWheel.rotation.y = currentSteerAngle;

    // 3. Steering wheel rotation in cockpit (steer right turns wheel clockwise)
    steeringWheelGroup.rotation.z = -steerInput * Math.PI * 1.5;

    // 4. Bus suspension body roll (lean outward when turning)
    // Speed factor increases centrifugal roll
    const rollFactor = Math.min(1.0, speedKmh / 60);
    const targetRoll = steerInput * rollFactor * 0.08;
    busBodyGroup.rotation.z = THREE.MathUtils.damp(busBodyGroup.rotation.z, targetRoll, 6.0, dt);

    // Subtle pitch on acceleration/braking
    const targetPitch = isBraking ? 0.03 : Math.min(0.015, (speedKmh / 90) * 0.01);
    busBodyGroup.rotation.x = THREE.MathUtils.damp(busBodyGroup.rotation.x, targetPitch, 5.0, dt);

    // 5. Headlights & Taillights
    spotL.intensity = headlightsOn ? 3.0 : 0.0;
    spotR.intensity = headlightsOn ? 3.0 : 0.0;
    (headlightLensMat as THREE.MeshBasicMaterial).color.setHex(headlightsOn ? 0xfef08a : 0x475569);

    if (isBraking) {
      (tailLensMat as THREE.MeshBasicMaterial).color.setHex(0xef4444); // Bright braking red
    } else {
      (tailLensMat as THREE.MeshBasicMaterial).color.setHex(headlightsOn ? 0x991b1b : 0x450a0a);
    }

    // 6. Update dashboard texture at throttled 10 fps to save canvas overhead
    const now = performance.now();
    if (now - lastDashUpdate > 100) {
      lastDashUpdate = now;
      const newDashTex = createDashboardGaugesTexture(speedKmh, rpm, fuelFraction, engineTemp);
      dashboardMaterial.map?.dispose();
      dashboardMaterial.map = newDashTex;
      dashboardMaterial.needsUpdate = true;
    }
  };

  const updateDestination = (route: RouteInfo, bus: BusModelConfig) => {
    const newTex = createDestinationBoardTexture(route.tamilDestination, route.destination, bus.typeBadge);
    destMat.map?.dispose();
    destMat.map = newTex;
    destMat.needsUpdate = true;
  };

  return {
    group: masterGroup,
    busBodyGroup,
    frontLeftWheel,
    frontRightWheel,
    rearLeftWheel,
    rearRightWheel,
    steeringWheelGroup,
    dashboardMaterial,
    headlightLeft: spotL,
    headlightRight: spotR,
    headlightLenses: [headlightLensL, headlightLensR],
    taillightLenses: [tailL, tailR],
    destinationBoardMesh,
    driverCameraAnchor,
    exteriorCameraAnchor,
    lookAtAnchor,
    update,
    updateDestination,
  };
}
