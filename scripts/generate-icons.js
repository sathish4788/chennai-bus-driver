import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Minimal Pure-JS PNG Encoder
function createPNG(width, height, getPixel) {
  // getPixel(x, y) returns [r, g, b, a] in 0-255
  const rowStride = width * 4 + 1; // 1 filter byte per scanline
  const rawData = Buffer.alloc(height * rowStride);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 79, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // non-interlaced

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate an Indian Tamil Nadu bus graphic (Dark Blue, Yellow, White & Emerald)
function busPainter(isMaskable) {
  return (x, y, w, h) => {
    const nx = x / w;
    const ny = y / h;

    // Background gradient: coastal blue sky to deep ocean
    let bgR = 15, bgG = 30, bgB = 75; // deep navy
    if (ny < 0.45) {
      // Golden twilight sky
      const t = ny / 0.45;
      bgR = Math.round(20 + 220 * (1 - t) + 15 * t);
      bgG = Math.round(50 + 130 * (1 - t) + 40 * t);
      bgB = Math.round(110 + 40 * (1 - t) + 110 * t);
    } else if (ny < 0.65) {
      // Highway sea horizon
      bgR = 14; bgG = 116; bgB = 144; // cyan ocean
    } else {
      // Asphalt highway road
      bgR = 30; bgG = 41; bgB = 59;
    }

    // Road markings (yellow dashed line in the bottom center)
    if (ny >= 0.72 && ny <= 0.95) {
      if (Math.abs(nx - 0.5) < 0.015 && (Math.floor(ny * 25) % 2 === 0)) {
        return [250, 204, 21, 255]; // Yellow dashed line
      }
    }

    // Bus rendering in center
    // Bus bounds:
    const scale = isMaskable ? 0.7 : 0.85;
    const bx = (nx - 0.5) / scale + 0.5;
    const by = (ny - 0.5) / scale + 0.5;

    // Bus body rectangle: x: 0.18 to 0.82, y: 0.32 to 0.75
    if (bx >= 0.18 && bx <= 0.82 && by >= 0.32 && by <= 0.75) {
      // Rounded roof corners
      const cornerR = 0.05;
      const isTopLeft = bx < 0.18 + cornerR && by < 0.32 + cornerR;
      const isTopRight = bx > 0.82 - cornerR && by < 0.32 + cornerR;
      if (isTopLeft) {
        const dx = (bx - (0.18 + cornerR)) / cornerR;
        const dy = (by - (0.32 + cornerR)) / cornerR;
        if (dx * dx + dy * dy > 1) return [bgR, bgG, bgB, 255];
      }
      if (isTopRight) {
        const dx = (bx - (0.82 - cornerR)) / cornerR;
        const dy = (by - (0.32 + cornerR)) / cornerR;
        if (dx * dx + dy * dy > 1) return [bgR, bgG, bgB, 255];
      }

      // Windshield & destination board area
      if (by >= 0.35 && by <= 0.40 && bx >= 0.25 && bx <= 0.75) {
        return [250, 204, 21, 255]; // Golden LED Destination Board
      }
      if (by >= 0.42 && by <= 0.56 && bx >= 0.22 && bx <= 0.78) {
        // Front Windshield
        // Glass gradient with sky reflection
        const glassT = (by - 0.42) / 0.14;
        return [
          Math.round(180 - glassT * 80),
          Math.round(220 - glassT * 60),
          Math.round(245 - glassT * 40),
          255
        ];
      }

      // Windshield wiper divider
      if (by >= 0.42 && by <= 0.56 && Math.abs(bx - 0.5) < 0.01) {
        return [20, 20, 20, 255];
      }

      // Front Headlights
      if (by >= 0.65 && by <= 0.70) {
        if ((bx >= 0.22 && bx <= 0.30) || (bx >= 0.70 && bx <= 0.78)) {
          return [254, 240, 138, 255]; // Bright halogen yellow/white
        }
      }

      // Front Grille
      if (by >= 0.64 && by <= 0.71 && bx >= 0.38 && bx <= 0.62) {
        if (Math.floor((by - 0.64) * 80) % 2 === 0) {
          return [30, 41, 59, 255]; // Grille slats
        } else {
          return [203, 213, 225, 255]; // Chrome bars
        }
      }

      // Number plate
      if (by >= 0.71 && by <= 0.74 && bx >= 0.42 && bx <= 0.58) {
        return [250, 204, 21, 255]; // TN Yellow plate
      }

      // TNSTC Classic Green & White Livery
      if (by >= 0.57 && by <= 0.63) {
        return [248, 250, 252, 255]; // White middle band
      }

      // Bus main body emerald green / royal blue
      return [16, 120, 80, 255]; // Rich TNSTC Emerald Green
    }

    // Rearview mirrors
    if (by >= 0.44 && by <= 0.54) {
      if ((bx >= 0.13 && bx <= 0.17) || (bx >= 0.83 && bx <= 0.87)) {
        return [30, 41, 59, 255];
      }
    }

    // Bus Wheels at bottom
    if (by >= 0.73 && by <= 0.82) {
      if ((bx >= 0.22 && bx <= 0.32) || (bx >= 0.68 && bx <= 0.78)) {
        // Tyre black
        const wx = bx < 0.5 ? (bx - 0.27) / 0.05 : (bx - 0.73) / 0.05;
        const wy = (by - 0.775) / 0.045;
        if (wx * wx + wy * wy <= 1.0) {
          if (wx * wx + wy * wy <= 0.35) {
            return [203, 213, 225, 255]; // Hubcap silver
          }
          return [20, 20, 24, 255]; // Black rubber
        }
      }
    }

    return [bgR, bgG, bgB, 255];
  };
}

// Generate PNG files
console.log('Generating PWA icons...');
const png192 = createPNG(192, 192, busPainter(false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

const png512 = createPNG(512, 512, busPainter(false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

const pngMaskable512 = createPNG(512, 512, busPainter(true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable512);

const appleTouchIcon = createPNG(180, 180, busPainter(false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

// Favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png192);

// SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fdba74" />
      <stop offset="40%" stop-color="#f43f5e" />
      <stop offset="60%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="busBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="windshield" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#skyGrad)"/>
  <!-- Road -->
  <path d="M0 360 L512 360 L512 512 L0 512 Z" fill="#1e293b"/>
  <line x1="256" y1="380" x2="256" y2="420" stroke="#facc15" stroke-width="8" stroke-dasharray="24 16"/>
  <!-- Wheels -->
  <rect x="110" y="380" width="50" height="45" rx="10" fill="#0f172a" stroke="#475569" stroke-width="4"/>
  <rect x="352" y="380" width="50" height="45" rx="10" fill="#0f172a" stroke="#475569" stroke-width="4"/>
  <!-- Bus Body -->
  <rect x="90" y="160" width="332" height="230" rx="36" fill="url(#busBody)" stroke="#064e3b" stroke-width="6"/>
  <!-- Destination Board -->
  <rect x="130" y="180" width="252" height="34" rx="8" fill="#1e293b"/>
  <text x="256" y="204" font-family="sans-serif" font-weight="900" font-size="16" fill="#facc15" text-anchor="middle" letter-spacing="2">CHENNAI ➔ TN</text>
  <!-- Windshield -->
  <rect x="116" y="226" width="280" height="85" rx="16" fill="url(#windshield)" opacity="0.95"/>
  <line x1="256" y1="226" x2="256" y2="311" stroke="#0f172a" stroke-width="6"/>
  <!-- White Stripe -->
  <rect x="90" y="318" width="332" height="26" fill="#f8fafc"/>
  <text x="256" y="336" font-family="sans-serif" font-weight="800" font-size="12" fill="#047857" text-anchor="middle">TAMIL NADU STATE EXPRESS</text>
  <!-- Headlights -->
  <circle cx="130" cy="360" r="14" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
  <circle cx="382" cy="360" r="14" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
  <!-- Grille -->
  <rect x="180" y="348" width="152" height="24" rx="6" fill="#334155"/>
  <line x1="190" y1="360" x2="322" y2="360" stroke="#94a3b8" stroke-width="3"/>
  <!-- Number Plate -->
  <rect x="216" y="375" width="80" height="14" rx="3" fill="#facc15"/>
  <text x="256" y="386" font-family="monospace" font-weight="bold" font-size="9" fill="#0f172a" text-anchor="middle">TN 01 N 2026</text>
  <!-- Mirrors -->
  <rect x="65" y="235" width="18" height="45" rx="5" fill="#334155"/>
  <rect x="429" y="235" width="18" height="45" rx="5" fill="#334155"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

console.log('All icons generated successfully!');
