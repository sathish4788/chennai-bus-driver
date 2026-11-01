import * as THREE from 'three';

// Procedural Canvas Texture Generator Helpers

/**
 * Creates high-resolution dynamic CanvasTexture with SRGB color space and anisotropy
 */
export function createDestinationBoardTexture(
  tamilDestination: string,
  englishDestination: string,
  busBadge: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Background: dark acrylic glass display board
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border frame
  ctx.strokeStyle = '#f59e0b'; // amber border
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  // Tamil Route Display (Large prominent amber LED style)
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`சென்னை ➔ ${tamilDestination}`, canvas.width / 2, 75);

  // English Route Display
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px sans-serif';
  ctx.fillText(`CHENNAI ➔ ${englishDestination.toUpperCase()}`, canvas.width / 2, 150);

  // Bottom Badge
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`★ ${busBadge} ★ அரசு விரைவுப் பேருந்து`, canvas.width / 2, 215);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Milestone texture (Indian National Highway standard: Yellow top for NH, white bottom)
 */
export function createMilestoneTexture(townTamil: string, distanceKm: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Top half: NH 45 Yellow dome
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 512, 180);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NH 45', 256, 90);

  // Bottom half: Crisp white stone
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 180, 512, 332);

  // Town Tamil name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 58px system-ui, sans-serif';
  ctx.fillText(townTamil, 256, 270);

  // Distance in KM
  ctx.font = '900 76px sans-serif';
  ctx.fillText(`${distanceKm} KM`, 256, 380);

  // Tamil km label
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText('கி.மீ', 256, 460);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Speed limit sign (Circular 90 km/h)
 */
export function createSpeedLimitSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(0, 0, 512, 512);

  // Outer red circle
  ctx.beginPath();
  ctx.arc(256, 256, 240, 0, Math.PI * 2);
  ctx.fillStyle = '#ef4444';
  ctx.fill();

  // White inner circle
  ctx.beginPath();
  ctx.arc(256, 256, 185, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Black 90 text
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 160px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('90', 256, 230);

  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('MAX SPEED', 256, 330);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Roadside Tea Stall / Hotel signboard texture
 */
export function createTeaStallTexture(stallName: string, subText: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b91c1c'; // Classic South Indian red signage
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 244);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(stallName, 256, 75);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px system-ui, sans-serif';
  ctx.fillText(subText, 256, 140);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '24px sans-serif';
  ctx.fillText('HOT VADA · FILTER COFFEE · CHAI', 256, 200);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Petrol Bunk roadside banner texture
 */
export function createPetrolBunkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Indian Oil style orange / blue banner
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#f97316';
  ctx.fillRect(0, 0, 512, 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TAMIL NADU HIGHWAY FUELS', 256, 30);

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('DIESEL BUNK ⛽', 256, 115);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('டீசல் நிலையம் · PULL IN TO REFUEL', 256, 180);

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('₹94.20 / Litre · Free Air & Water', 256, 225);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Cockpit Speedometer Dial Texture
 */
export function createDashboardGaugesTexture(
  speedKmh: number,
  rpm: number,
  fuelFraction: number,
  tempC: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1024, 512);

  // Speedometer Dial (Center Left)
  const cx1 = 300;
  const cy1 = 256;
  const r1 = 180;

  // Outer ring
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(cx1, cy1, r1, 0.75 * Math.PI, 2.25 * Math.PI);
  ctx.stroke();

  // Speed tick marks (0 to 120 km/h)
  for (let s = 0; s <= 120; s += 10) {
    const angle = 0.75 * Math.PI + (s / 120) * 1.5 * Math.PI;
    const isMajor = s % 20 === 0;
    const tickLen = isMajor ? 24 : 14;
    const x1 = cx1 + Math.cos(angle) * (r1 - 10);
    const y1 = cy1 + Math.sin(angle) * (r1 - 10);
    const x2 = cx1 + Math.cos(angle) * (r1 - 10 - tickLen);
    const y2 = cy1 + Math.sin(angle) * (r1 - 10 - tickLen);

    ctx.strokeStyle = s > 90 ? '#ef4444' : s >= 80 ? '#f59e0b' : '#94a3b8';
    ctx.lineWidth = isMajor ? 5 : 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (isMajor) {
      const tx = cx1 + Math.cos(angle) * (r1 - 48);
      const ty = cy1 + Math.sin(angle) * (r1 - 48);
      ctx.fillStyle = s > 90 ? '#f87171' : '#cbd5e1';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${s}`, tx, ty);
    }
  }

  // Speedometer Needle
  const clampedSpeed = Math.min(120, Math.max(0, speedKmh));
  const speedAngle = 0.75 * Math.PI + (clampedSpeed / 120) * 1.5 * Math.PI;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx1, cy1);
  ctx.lineTo(cx1 + Math.cos(speedAngle) * (r1 - 25), cy1 + Math.sin(speedAngle) * (r1 - 25));
  ctx.stroke();

  // Center hub
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(cx1, cy1, 16, 0, Math.PI * 2);
  ctx.fill();

  // Speedometer digital readout
  ctx.fillStyle = speedKmh > 90 ? '#ef4444' : speedKmh >= 80 ? '#f59e0b' : '#22c55e';
  ctx.font = '900 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(speedKmh)}`, cx1, cy1 + 75);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('KM/H (MAX 90)', cx1, cy1 + 105);

  // RPM Dial (Center Right)
  const cx2 = 724;
  const cy2 = 256;
  const r2 = 180;

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(cx2, cy2, r2, 0.75 * Math.PI, 2.25 * Math.PI);
  ctx.stroke();

  // RPM ticks (0 to 3000)
  for (let r = 0; r <= 3000; r += 500) {
    const angle = 0.75 * Math.PI + (r / 3000) * 1.5 * Math.PI;
    const x1 = cx2 + Math.cos(angle) * (r2 - 10);
    const y1 = cy2 + Math.sin(angle) * (r2 - 10);
    const x2 = cx2 + Math.cos(angle) * (r2 - 30);
    const y2 = cy2 + Math.sin(angle) * (r2 - 30);

    ctx.strokeStyle = r > 2400 ? '#ef4444' : '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const tx = cx2 + Math.cos(angle) * (r2 - 50);
    const ty = cy2 + Math.sin(angle) * (r2 - 50);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${r / 100}`, tx, ty);
  }

  // RPM Needle
  const clampedRpm = Math.min(3000, Math.max(0, rpm));
  const rpmAngle = 0.75 * Math.PI + (clampedRpm / 3000) * 1.5 * Math.PI;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx2, cy2);
  ctx.lineTo(cx2 + Math.cos(rpmAngle) * (r2 - 25), cy2 + Math.sin(rpmAngle) * (r2 - 25));
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(cx2, cy2, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(rpm)}`, cx2, cy2 + 75);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('RPM x 100', cx2, cy2 + 105);

  // Center Status Bar (Fuel & Temp)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(440, 60, 144, 400);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.strokeRect(440, 60, 144, 400);

  // Fuel bar
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('DIESEL', 512, 95);

  const fuelH = 140 * Math.max(0, Math.min(1, fuelFraction));
  ctx.fillStyle = fuelFraction < 0.2 ? '#ef4444' : '#22c55e';
  ctx.fillRect(460, 260 - fuelH, 104, fuelH);
  ctx.strokeRect(460, 120, 104, 140);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`${Math.round(fuelFraction * 100)}%`, 512, 285);

  // Engine Temp
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('TEMP', 512, 335);

  const tempNorm = Math.min(1, Math.max(0, (tempC - 60) / 60));
  const tempH = 70 * tempNorm;
  ctx.fillStyle = tempC > 95 ? '#ef4444' : '#38bdf8';
  ctx.fillRect(460, 420 - tempH, 104, tempH);
  ctx.strokeRect(460, 350, 104, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`${Math.round(tempC)}°C`, 512, 445);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural asphalt texture with road markings
 */
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base with subtle aggregate speckling
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 1024, 1024);

  // Noise speckles
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 24;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Continuous outer white boundary lines
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(40, 0, 20, 1024);
  ctx.fillRect(964, 0, 20, 1024);

  // Center double yellow divider lines
  ctx.fillStyle = '#facc15';
  ctx.fillRect(502, 0, 8, 1024);
  ctx.fillRect(514, 0, 8, 1024);

  // Dashed white lane dividers (for 4 lanes: at 270 and 750)
  ctx.fillStyle = '#e2e8f0';
  for (let y = 0; y < 1024; y += 128) {
    ctx.fillRect(270, y + 16, 12, 80);
    ctx.fillRect(742, y + 16, 12, 80);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * CMBT Koyambedu Terminal Header Banner
 */
export function createCMBTBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#065f46'; // Tamil Nadu forest green
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, 1012, 244);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 50px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('சென்னை புறநகர் பேருந்து நிலையம் - கோயம்பேடு (CMBT)', 512, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px sans-serif';
  ctx.fillText('CHENNAI MOFUSSIL BUS TERMINUS', 512, 145);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('★ PLATFORM 12: TAMIL NADU SOUTHERN HIGHWAY CORRIDOR ★', 512, 205);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
