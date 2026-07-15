// Gera os ícones PNG do PWA/iOS (sem dependências externas): um vestido coral
// com contorno navy sobre fundo branco, igual ao favicon (src/app/icon.svg).
// Rasteriza a silhueta por point-in-polygon com supersampling (antialias).
// Executar: node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

// ---- codificação PNG (RGB, sem dependências) --------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function hexToRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

// ---- geometria do vestido (mesmo desenho do favicon, viewBox 64) ------------
const VESTIDO = [
  [22.5, 15.5], // ombro esquerdo
  [27, 18],
  [32, 21], // decote (centro)
  [37, 18],
  [41.5, 15.5], // ombro direito
  [39, 24],
  [37, 31.5], // cintura direita
  [49, 50], // barra direita
  [40, 52.5],
  [24, 52.5],
  [15, 50], // barra esquerda
  [27, 31.5], // cintura esquerda
  [24, 24],
];
const CINTURA = [27, 31.5, 37, 31.5]; // linha da cintura
const CONTORNO = 1.9; // meia-largura do traço (unidades de desenho)

function dentro(px, py, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function distPoly(px, py, poly) {
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    d = Math.min(d, distSeg(px, py, poly[j][0], poly[j][1], poly[i][0], poly[i][1]));
  }
  return d;
}

const BG = hexToRgb("#ffffff");
const CORAL = hexToRgb("#eb9b8b");
const NAVY = hexToRgb("#1e2b47");

// Cor no ponto (dx,dy) em coordenadas de desenho (viewBox 64).
function corNoPonto(dx, dy) {
  const dEdge = Math.min(distPoly(dx, dy, VESTIDO), distSeg(dx, dy, ...CINTURA));
  if (dEdge <= CONTORNO) return NAVY;
  if (dentro(dx, dy, VESTIDO)) return CORAL;
  return BG;
}

function gerarPNG(size, maskable) {
  // maskable precisa de zona de segurança: encolhe o desenho e centraliza.
  const scale = (maskable ? size * 0.82 : size) / 64;
  const offset = maskable ? size * 0.09 : 0;
  const SS = 3; // supersampling para suavizar as bordas

  const raw = Buffer.alloc((size * 3 + 1) * size);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filtro da linha
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const dx = (x + (sx + 0.5) / SS - offset) / scale;
          const dy = (y + (sy + 0.5) / SS - offset) / scale;
          const c = corNoPonto(dx, dy);
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const n = SS * SS;
      raw[p++] = Math.round(r / n);
      raw[p++] = Math.round(g / n);
      raw[p++] = Math.round(b / n);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  writeFileSync(resolve(OUT, `icon-${size}.png`), gerarPNG(size, false));
  writeFileSync(resolve(OUT, `icon-${size}-maskable.png`), gerarPNG(size, true));
}
console.log("Ícones (vestido) gerados em public/icons/");
