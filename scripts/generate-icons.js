// Generates the PWA icons referenced by public/manifest.json.
// Produces solid medical-green PNGs with a white "pulse" glyph, using only
// Node built-ins (zlib) — no native image deps required.
//
//   node scripts/generate-icons.js

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const BRAND = [22, 163, 74]; // #16a34a
const WHITE = [255, 255, 255];
const OUT_DIR = path.join(__dirname, "..", "public", "icons");

/** CRC32 — uses zlib.crc32 when available (Node >= 22.2), else a fallback. */
function crc32(buf) {
  if (typeof zlib.crc32 === "function") return zlib.crc32(buf) >>> 0;
  let c;
  const table =
    crc32._t ||
    (crc32._t = Array.from({ length: 256 }, (_, n) => {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c >>> 0;
    }));
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** Draws a simple heartbeat/pulse line in white over the brand background. */
function drawPulse(px, py, size) {
  // Normalize to 0..1 and trace a polyline roughly centered vertically.
  const x = px / size;
  const y = py / size;
  const pts = [
    [0.18, 0.5],
    [0.36, 0.5],
    [0.44, 0.32],
    [0.54, 0.7],
    [0.64, 0.5],
    [0.82, 0.5],
  ];
  const thickness = 0.045;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = ((x - x1) * dx + (y - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    const dist = Math.hypot(x - cx, y - cy);
    if (dist <= thickness) return true;
  }
  return false;
}

function makePng(size, { maskable } = {}) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bit depth 8, color type 2 (RGB)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Raw image data: each row prefixed with a filter byte (0).
  // For maskable icons we keep the glyph well inside the safe zone (already is).
  const inset = maskable ? size * 0.12 : 0;
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const inGlyph =
        x > inset &&
        x < size - inset &&
        y > inset &&
        y < size - inset &&
        drawPulse(x, y, size);
      const c = inGlyph ? WHITE : BRAND;
      raw[o++] = c[0];
      raw[o++] = c[1];
      raw[o++] = c[2];
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-maskable-192.png", size: 192, maskable: true },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
];

for (const t of targets) {
  const png = makePng(t.size, { maskable: t.maskable });
  fs.writeFileSync(path.join(OUT_DIR, t.name), png);
  console.log(`✓ ${t.name} (${t.size}x${t.size}, ${png.length} bytes)`);
}

console.log("Done. Icons written to public/icons/");
