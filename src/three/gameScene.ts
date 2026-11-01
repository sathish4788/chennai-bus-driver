import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BusModelConfig, RouteInfo, CameraView, WeatherType, BusUpgrades } from '../types/game';
import { createProceduralBus, BusRig } from './busModel';
import { createTamilNaduEnvironment, EnvironmentRig } from './environment';
import { createTrafficSystem, TrafficRig } from './traffic';
import { sound } from '../systems/audio';

export interface GameSceneControls {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 (left) to +1 (right)
  handbrake: boolean;
  cameraView: CameraView;
  headlights: boolean;
  wipers: boolean;
}

export interface GameSceneCallbacks {
  onSpeedWarning: (level: 'none' | 'amber' | 'police' | 'danger') => void;
  onFineIssued: (amount: number, reason: string) => void;
  onLowFuelWarning: () => void;
  onPuncture: () => void;
  onNearPetrolBunk: (canRefuel: boolean) => void;
  onArrival: () => void;
  onVehicleCollision: (vehicleName: string, fineAmount: number) => void;
  onTelemetryUpdate: (data: {
    speedKmh: number;
    rpm: number;
    gear: number;
    distanceCoveredKm: number;
    remainingKm: number;
    progressPercent: number;
    fuelLitres: number;
    fuelPercent: number;
    tempC: number;
  }) => void;
}

// Reusable math objects (Zero GC in animation loop)
const _vec3 = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _targetPos = new THREE.Vector3();

export class GameScene {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public isSoftwareGl: boolean;

  private busRig: BusRig;
  private envRig: EnvironmentRig;
  private trafficRig: TrafficRig;

  private route: RouteInfo;
  private busConfig: BusModelConfig;
  private upgrades: BusUpgrades;
  private callbacks: GameSceneCallbacks;

  // Rain particles
  private rainParticles: THREE.Points | null = null;

  // Lights & Environment
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Driving Physics State
  private busX: number = 3.8; // Starting in forward lane at CMBT
  private busZ: number = 15.0; // Start at platform
  private speedKmh: number = 0;
  private steerAngle: number = 0;
  private currentGear: number = 1;
  private engineRpm: number = 750;
  private fuelLitres: number;
  private fuelMaxLitres: number;
  private engineTempC: number = 82;
  private tyreHealth: number = 100;
  private hasPuncture: boolean = false;
  private puncturePullDirection: number = 0;

  // Speed warning & fine monitoring
  private fineCooldown: number = 0;
  private collisionCooldown: number = 0;
  private cameraShake: number = 0;
  private lastBrakeReleaseState: boolean = false;

  // Collision sparks
  private sparkParticles: THREE.Points | null = null;
  private sparkVelocities: Float32Array = new Float32Array(240);
  private sparkTimer: number = 0;

  // Journey Progress
  private virtualTrackLength: number = 3200;
  private journeyProgressPercent: number = 0;
  private distanceCoveredKm: number = 0;
  private isArrivalTriggered: boolean = false;

  // Animation Loop State
  private animationFrameId: number = 0;
  private isDestroyed: boolean = false;
  private lastTime: number = performance.now();
  private isDrivingActive: boolean = false;

  // External orbit drag offset for exterior camera
  public cameraOrbitYaw: number = 0;
  public cameraOrbitPitch: number = 0;

  constructor(
    container: HTMLElement,
    route: RouteInfo,
    busConfig: BusModelConfig,
    upgrades: BusUpgrades,
    callbacks: GameSceneCallbacks
  ) {
    this.container = container;
    this.route = route;
    this.busConfig = busConfig;
    this.upgrades = upgrades;
    this.callbacks = callbacks;

    // Fuel capacity modified by upgrades
    this.fuelMaxLitres = busConfig.fuelCapacity + (upgrades.fuelTankLevel - 1) * 20;
    this.fuelLitres = this.fuelMaxLitres * 0.9; // 90% full tank at start

    // 1. Software WebGL Guard
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Three.js Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Horizon Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Sky blue
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.0035);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.2,
      1200
    );

    // 4. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Setup
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.sunLight.position.set(60, 100, 50);
    this.sunLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      this.sunLight.shadow.mapSize.width = 1024;
      this.sunLight.shadow.mapSize.height = 1024;
      this.sunLight.shadow.camera.near = 10;
      this.sunLight.shadow.camera.far = 300;
      this.sunLight.shadow.camera.left = -60;
      this.sunLight.shadow.camera.right = 60;
      this.sunLight.shadow.camera.top = 60;
      this.sunLight.shadow.camera.bottom = -60;
      this.sunLight.shadow.bias = -0.0005;
      this.sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sunLight);

    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x15803d, 0.85);
    this.scene.add(this.hemiLight);

    // 6. Bus Rig
    this.busRig = createProceduralBus(busConfig, route);
    this.busRig.group.position.set(this.busX, 0, this.busZ);
    this.scene.add(this.busRig.group);

    // 7. Environment Rig
    this.envRig = createTamilNaduEnvironment(route);
    this.scene.add(this.envRig.group);

    // 8. Traffic Rig
    this.trafficRig = createTrafficSystem(this.virtualTrackLength);
    this.scene.add(this.trafficRig.group);

    // 9. Rain Particle System
    this.initRain();

    // 10. Collision Sparks System
    this.initSparks();

    // 11. Window resize listener
    window.addEventListener('resize', this.onResize);

    // Start render loop
    this.startLoop();
  }

  private initRain() {
    const rainCount = 1800;
    const rainGeom = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPos[i] = (Math.random() - 0.5) * 80;
      rainPos[i + 1] = Math.random() * 40;
      rainPos[i + 2] = (Math.random() - 0.5) * 120;
    }

    rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.18,
      transparent: true,
      opacity: 0.7,
    });

    this.rainParticles = new THREE.Points(rainGeom, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  private initSparks() {
    const sparkCount = 80;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) pos[i] = 0;
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfacc15,
      size: 0.35,
      transparent: true,
      opacity: 0,
    });
    this.sparkParticles = new THREE.Points(geom, mat);
    this.scene.add(this.sparkParticles);
  }

  public triggerSparkBurst(x: number, z: number) {
    if (!this.sparkParticles) return;
    const pos = this.sparkParticles.geometry.attributes.position.array as Float32Array;
    const count = 80;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = 1.0 + Math.random() * 0.6;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.6;
      this.sparkVelocities[i * 3] = (Math.random() - 0.5) * 14;
      this.sparkVelocities[i * 3 + 1] = 3 + Math.random() * 7;
      this.sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    this.sparkParticles.geometry.attributes.position.needsUpdate = true;
    (this.sparkParticles.material as THREE.PointsMaterial).opacity = 1.0;
    this.sparkTimer = 0.65;
  }

  public setWeather(weather: WeatherType) {
    if (weather === 'rain') {
      this.scene.background = new THREE.Color(0x475569);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.setHex(0x475569);
      this.sunLight.intensity = 0.6;
      this.hemiLight.intensity = 0.4;
      if (this.rainParticles) this.rainParticles.visible = true;
      sound.setRain(true);
    } else if (weather === 'sunset') {
      this.scene.background = new THREE.Color(0xf97316); // Golden orange
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.setHex(0xf97316);
      this.sunLight.intensity = 1.8;
      this.sunLight.color.setHex(0xfdba74);
      this.hemiLight.color.setHex(0xf43f5e);
      if (this.rainParticles) this.rainParticles.visible = false;
      sound.setRain(false);
    } else {
      // Sunny / Afternoon
      this.scene.background = new THREE.Color(0x38bdf8);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.setHex(0x38bdf8);
      this.sunLight.intensity = 2.2;
      this.sunLight.color.setHex(0xfffaed);
      this.hemiLight.color.setHex(0xbae6fd);
      if (this.rainParticles) this.rainParticles.visible = false;
      sound.setRain(false);
    }
  }

  public honk() {
    sound.playIndianBusHorn();
    this.trafficRig.onHonk(this.busZ, this.busX);
  }

  public startBoarding(onComplete: () => void) {
    sound.playDoorSound(true);
    this.envRig.startBoardingAnimation(() => {
      sound.playDoorSound(false);
      sound.playConductorWhistle();
      this.isDrivingActive = true;
      sound.startEngine();
      onComplete();
    });
  }

  public startAlighting(onComplete: () => void) {
    sound.playDoorSound(true);
    this.envRig.startAlightingAnimation(() => {
      sound.playDoorSound(false);
      onComplete();
    });
  }

  public refuel(litres: number) {
    this.fuelLitres = Math.min(this.fuelMaxLitres, this.fuelLitres + litres);
    sound.playRefuelSound();
  }

  public repairPuncture() {
    this.hasPuncture = false;
    this.tyreHealth = 100;
    this.puncturePullDirection = 0;
  }

  /**
   * Physics & Simulation Step
   */
  public step(dt: number, controls: GameSceneControls) {
    // Clamp delta time to avoid large jumps
    const safeDt = Math.min(dt, 0.05);

    // 1. Steering Physics
    // In India, traffic drives on the left, forward lanes are x: 1.5 to 7.0
    // Self-centering spring
    const targetSteer = controls.steer;
    const steerSpeed = 4.5;
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer, steerSpeed, safeDt);

    // If puncture active, pull steering to one side
    if (this.hasPuncture) {
      this.steerAngle += this.puncturePullDirection * 0.15;
    }

    // 2. Acceleration & Inertia (Gradual bus pickup)
    const engineBonus = (this.upgrades.engineLevel - 1) * 0.08;
    const baseAccel = this.busConfig.acceleration * (1 + engineBonus);
    const maxPermittedSpeed = 90; // Strictly 90 km/h in game

    if (this.isDrivingActive) {
      if (controls.throttle > 0 && this.fuelLitres > 0) {
        // Accelerate gradually
        // Acceleration drops off as speed increases
        const speedRatio = this.speedKmh / maxPermittedSpeed;
        const accelPower = Math.max(0.08, 1.0 - Math.pow(speedRatio, 1.8));
        const punctureFactor = this.hasPuncture ? 0.45 : 1.0;
        const deltaSpeed = controls.throttle * baseAccel * accelPower * 14.0 * safeDt * punctureFactor;
        this.speedKmh = Math.min(maxPermittedSpeed, this.speedKmh + deltaSpeed);
      } else {
        // Natural rolling friction & wind drag
        const drag = 3.5 * safeDt;
        this.speedKmh = Math.max(0, this.speedKmh - drag);
      }

      // 3. Braking Physics
      const brakeBonus = (this.upgrades.brakeLevel - 1) * 0.15;
      if (controls.handbrake) {
        // Emergency brake
        this.speedKmh = Math.max(0, this.speedKmh - 42.0 * (1 + brakeBonus) * safeDt);
        sound.playBrakeSqueal();
      } else if (controls.brake > 0) {
        // Foot brake
        this.speedKmh = Math.max(0, this.speedKmh - controls.brake * 24.0 * (1 + brakeBonus) * safeDt);
      }

      // Air brake release hiss sound when brake is released after heavy braking
      const isCurrentlyBraking = controls.brake > 0.4 || controls.handbrake;
      if (this.lastBrakeReleaseState && !isCurrentlyBraking && this.speedKmh > 10) {
        sound.playAirBrakeSound();
      }
      this.lastBrakeReleaseState = isCurrentlyBraking;

      // 4. Position Updates
      // Lateral movement (speed-dependent steering response: steer right moves right)
      const speedMs = (this.speedKmh * 1000) / 3600;
      const turnSensitivity = Math.min(1.0, 0.4 + (this.speedKmh / 90) * 0.6);
      this.busX -= this.steerAngle * turnSensitivity * speedMs * safeDt * 0.6;
      // Clamp bus to highway bounds (-8.5m to 8.5m)
      this.busX = Math.max(-8.5, Math.min(8.5, this.busX));

      // Forward movement
      this.busZ += speedMs * safeDt;
      this.busRig.group.position.set(this.busX, 0, this.busZ);
      this.busRig.group.rotation.y = -this.steerAngle * 0.12 * Math.min(1.0, speedMs / 8);

      // 5. Gear & RPM simulation
      if (this.speedKmh < 1) {
        this.currentGear = 1;
        this.engineRpm = 750 + controls.throttle * 400;
      } else {
        // 6-speed manual/automatic transmission
        const gearThresholds = [0, 15, 32, 50, 68, 82, 100];
        let gear = 1;
        for (let g = 1; g <= 6; g++) {
          if (this.speedKmh >= gearThresholds[g - 1]) gear = g;
        }
        this.currentGear = gear;

        const lowBound = gearThresholds[gear - 1];
        const highBound = gearThresholds[gear] || 90;
        const gearRatio = Math.max(0, Math.min(1, (this.speedKmh - lowBound) / (highBound - lowBound)));
        this.engineRpm = 1100 + gearRatio * 1500;
      }

      // Update procedural engine sound
      sound.updateEngine(this.speedKmh, (this.engineRpm - 700) / 2000);

      // 6. Fuel Consumption
      // Scaled so a journey consumes around 25-45L
      const baseEfficiency = this.busConfig.fuelEfficiencyKmPerL * (1 + (this.upgrades.engineLevel - 1) * 0.05);
      const fuelPerMeter = 1 / (baseEfficiency * 1000);
      const fuelBurned = speedMs * safeDt * fuelPerMeter * (1 + controls.throttle * 0.4);
      this.fuelLitres = Math.max(0, this.fuelLitres - fuelBurned);

      if (this.fuelLitres < 15 && this.fuelLitres > 0) {
        this.callbacks.onLowFuelWarning();
      }

      // 7. Engine Temperature & Tyre Health
      this.engineTempC = 80 + (this.speedKmh / 90) * 12 + controls.throttle * 3;

      // 8. SPEED LIMIT & POLICE RULES
      // At 80 km/h: Amber warning
      // At 87 km/h: Police siren and speeding fine issued (-₹500)
      // Above 90 km/h: Critical danger warning
      this.fineCooldown = Math.max(0, this.fineCooldown - safeDt);

      if (this.speedKmh > 90) {
        this.callbacks.onSpeedWarning('danger');
        if (this.fineCooldown <= 0) {
          sound.playPoliceSiren(4);
          this.callbacks.onFineIssued(1000, 'CRITICAL: Severe Over-Speeding (>90 km/h)');
          this.fineCooldown = 8.0; // 8-sec fine cooldown
        }
      } else if (this.speedKmh >= 87) {
        this.callbacks.onSpeedWarning('police');
        if (this.fineCooldown <= 0) {
          sound.playPoliceSiren(3.5);
          this.callbacks.onFineIssued(500, 'Speed Limit Exceeded (≥87 km/h)');
          this.fineCooldown = 8.0;
        }
      } else if (this.speedKmh >= 80) {
        this.callbacks.onSpeedWarning('amber');
      } else {
        this.callbacks.onSpeedWarning('none');
      }

      // 9. Update Journey Distance & Progress
      this.journeyProgressPercent = Math.min(100, (this.busZ / this.virtualTrackLength) * 100);
      this.distanceCoveredKm = Math.min(
        this.route.distanceKm,
        (this.busZ / this.virtualTrackLength) * this.route.distanceKm
      );
      const remainingKm = Math.max(0, Math.round(this.route.distanceKm - this.distanceCoveredKm));

      // 10. Check Petrol Bunk Proximity
      const nearBunk = this.envRig.isNearPetrolBunk(this.busZ, this.busX);
      this.callbacks.onNearPetrolBunk(nearBunk);

      // 11. Check Arrival at Destination
      if (this.envRig.isNearDestination(this.busZ) && !this.isArrivalTriggered) {
        this.isArrivalTriggered = true;
        this.speedKmh = 0;
        this.isDrivingActive = false;
        sound.stopEngine();
        this.callbacks.onArrival();
      }

      // 12. Send Telemetry
      this.callbacks.onTelemetryUpdate({
        speedKmh: this.speedKmh,
        rpm: this.engineRpm,
        gear: this.currentGear,
        distanceCoveredKm: Math.round(this.distanceCoveredKm),
        remainingKm,
        progressPercent: Math.round(this.journeyProgressPercent),
        fuelLitres: Math.round(this.fuelLitres),
        fuelPercent: Math.round((this.fuelLitres / this.fuelMaxLitres) * 100),
        tempC: Math.round(this.engineTempC),
      });
    }

    // 13. Update 3D rigs
    this.busRig.update(
      safeDt,
      this.speedKmh,
      this.steerAngle,
      controls.brake > 0.1 || controls.handbrake,
      controls.headlights,
      this.engineRpm,
      this.fuelLitres / this.fuelMaxLitres,
      this.engineTempC
    );

    this.envRig.update(this.busZ, safeDt, 'sunny');

    this.collisionCooldown = Math.max(0, this.collisionCooldown - safeDt);

    const busSpeedMs = (this.speedKmh * 1000) / 3600;
    const { hitHazard, collision, busBlockedByVehicle, blockVehicleSpeedMs, maxAllowedBusZ } =
      this.trafficRig.update(safeDt, this.busZ, this.busX, busSpeedMs);

    if (collision && this.collisionCooldown <= 0) {
      this.collisionCooldown = 2.0; // Cooldown between collision fine deductions
      sound.playCrashSound();
      this.cameraShake = 0.55;
      this.triggerSparkBurst(collision.impactX, collision.impactZ);
      this.callbacks.onVehicleCollision(collision.vehicle.name, 1000);
      // Sudden deceleration from collision impact
      this.speedKmh = Math.max(0, this.speedKmh * 0.45);
    }

    if (busBlockedByVehicle && maxAllowedBusZ !== null) {
      if (this.busZ > maxAllowedBusZ) {
        this.busZ = maxAllowedBusZ;
        this.busRig.group.position.z = this.busZ;
        this.speedKmh = Math.min(this.speedKmh, (blockVehicleSpeedMs * 3600) / 1000);
      }
    }

    // Animate sparks
    if (this.sparkParticles && this.sparkTimer > 0) {
      this.sparkTimer -= safeDt;
      const pos = this.sparkParticles.geometry.attributes.position.array as Float32Array;
      const count = 80;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += this.sparkVelocities[i * 3] * safeDt;
        pos[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * safeDt;
        this.sparkVelocities[i * 3 + 1] -= 9.8 * safeDt; // Gravity on sparks
        pos[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * safeDt;
      }
      this.sparkParticles.geometry.attributes.position.needsUpdate = true;
      (this.sparkParticles.material as THREE.PointsMaterial).opacity = Math.max(0, this.sparkTimer / 0.65);
    }

    if (hitHazard && !this.hasPuncture) {
      // Tyre Puncture triggered!
      this.hasPuncture = true;
      this.tyreHealth = 25;
      this.puncturePullDirection = Math.random() > 0.5 ? 1 : -1;
      sound.playPunctureSound();
      this.callbacks.onPuncture();
    }

    // 14. Rain particle follow bus
    if (this.rainParticles && this.rainParticles.visible) {
      this.rainParticles.position.set(this.busX, 0, this.busZ);
      const pos = this.rainParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= safeDt * 35;
        if (pos[i] < 0) pos[i] = 40;
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 15. Sun light follows bus along highway
    this.sunLight.position.set(this.busX + 60, 100, this.busZ + 50);
    this.sunLight.target.position.set(this.busX, 0, this.busZ);
    this.sunLight.target.updateMatrixWorld();

    // 16. CAMERA MANAGEMENT (Exterior vs Driver Cockpit)
    this.updateCamera(controls.cameraView, safeDt);
  }

  /**
   * Smooth Camera Management for both views
   */
  private updateCamera(view: CameraView, dt: number) {
    if (view === 'cockpit') {
      // Cockpit View: Attached to driver seat inside windshield
      this.busRig.driverCameraAnchor.getWorldPosition(_camPos);
      this.camera.position.copy(_camPos);

      // Looking forward through windshield
      this.busRig.group.getWorldDirection(_vec3);
      _targetPos.copy(_camPos).add(_vec3.multiplyScalar(25));
      _targetPos.y += 0.2; // slight upward road horizon
      this.camera.lookAt(_targetPos);
      this.camera.fov = 68; // Wider perspective for cockpit
      this.camera.updateProjectionMatrix();
    } else {
      // Exterior Third-Person Follow Camera
      this.busRig.lookAtAnchor.getWorldPosition(_targetPos);

      // Base follow offset behind bus
      const baseDist = 12.0;
      const baseHeight = 4.2;
      const followYaw = this.cameraOrbitYaw;
      const followPitch = this.cameraOrbitPitch;

      const cosP = Math.cos(followPitch);
      const sinP = Math.sin(followPitch);
      const sinY = Math.sin(followYaw);
      const cosY = Math.cos(followYaw);

      // Position relative to bus: behind on negative Z
      const idealCamX = this.busX + sinY * baseDist * cosP;
      const idealCamY = baseHeight + sinP * 5.0;
      const idealCamZ = this.busZ - cosY * baseDist * cosP;

      // Smooth camera interpolation
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, idealCamX, 6.0, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, idealCamY, 6.0, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, idealCamZ, 8.0, dt);
      this.camera.lookAt(_targetPos.x, _targetPos.y + 0.8, _targetPos.z + 5.0);
      this.camera.fov = 55;
      this.camera.updateProjectionMatrix();
    }

    // Apply decaying camera shake from vehicle impacts
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.z += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 4.0, dt);
    }
  }

  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;

      const now = performance.now();
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.animationFrameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDestroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animationFrameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.animationFrameId = window.setTimeout(cb, 60);
      }
    };
    this.animationFrameId = window.setTimeout(poll, 5);
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animationFrameId);
    clearTimeout(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    sound.stopEngine();
    sound.setRain(false);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
