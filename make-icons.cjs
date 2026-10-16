// Generates the PWA icon set as PNGs without any image dependency.
// Writes 192, 512 and maskable-512 into public/icons/.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, 'public', 'icons');
fs.mkdirSync(OUT, { recursive: true });

// CRC32
const table = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, draw) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = draw(x, y, size);
      raw[o++] = r; raw[o++] = g; raw[o++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const NAVY = [16, 27, 45];
const BLUE = [76, 141, 255];
const TEAL = [35, 198, 170];
const BG = [243, 246, 251];

// Rounded-square badge with an upward "skill growth" arrow motif.
function badge(x, y, size, maskable) {
  const pad = maskable ? size * 0.18 : size * 0.06;
  const r = maskable ? size * 0.5 : size * 0.22;
  const cx = size / 2, cy = size / 2;

  // background
  if (maskable) return NAVY;

  // rounded rect mask
  const dx = Math.max(pad - x, x - (size - pad), 0);
  const dy = Math.max(pad - y, y - (size - pad), 0);
  if (dx * dx + dy * dy > r * r) return [0, 0, 0]; // transparent-ish (rendered as black)
  const t = (y - size) / size;

  // gradient navy -> deep blue
  let g = [0, 1, 2].map((i) => Math.round(NAVY[i] + (BLUE[i] - NAVY[i]) * (y / size) * 0.55));

  // Upward arrow: narrow head at the top widening downward into the shaft.
  const headTop = size * 0.26, headBottom = size * 0.58, headHalf = size * 0.21;
  if (y >= headTop && y <= headBottom) {
    const k = (y - headTop) / (headBottom - headTop);   // 0 at tip, 1 at base
    if (Math.abs(x - cx) < headHalf * k) return TEAL;
  }

  // shaft below the head
  const shaftHalf = size * 0.042;
  if (Math.abs(x - cx) < shaftHalf && y > headBottom && y < size * 0.78) return TEAL;

  // baseline
  if (y > size * 0.79 && y < size * 0.835 && Math.abs(x - cx) < size * 0.23) return [236, 244, 255];

  return g;
}

const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
];

for (const [name, size, maskable] of targets) {
  const buf = png(size, (x, y, s) => badge(x, y, s, maskable));
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(`wrote icons/${name}  ${size}x${size}  ${(buf.length / 1024).toFixed(1)} KB`);
}
