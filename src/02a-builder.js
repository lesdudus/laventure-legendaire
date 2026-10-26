// ------------------------------ TEXTURES PIXEL & MATÉRIAUX ------------------------------
const TEX = {}, MATS = {};
const TEXEL = { plain: 1.5, plaster: 3, wood: 1.2, parquet: 2.4, tile: 2, fabric: 0.7, carpet: 0.8, grass: 1.2, dirt: 1, metal: 1, paper: 0.8, leaf: 1.4, stone: 1.6 };

function pixTex(seed, fn, size = 16) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const r = mulberry32(seed);
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const v = clamp(fn(x, y, r), 0, 1) * 255, i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData.pixel = true;
  return t;
}

function buildMaterials() {
  TEX.plain = pixTex(1, (x, y, r) => 0.9 + r() * 0.1);
  TEX.plaster = pixTex(2, (x, y, r) => 0.94 + r() * 0.06);
  TEX.wood = pixTex(3, (x, y, r) => (y % 8 === 0 ? 0.72 : 0.86 + 0.07 * Math.sin(x * 0.8 + (y % 8) * 1.7) + r() * 0.05));
  TEX.parquet = pixTex(4, (x, y, r) => { const row = y >> 2; const seam = (x + row * 5) % 16 === 0; return y % 4 === 0 || seam ? 0.7 : 0.82 + r() * 0.1 + (row % 2) * 0.04; });
  TEX.tile = pixTex(5, (x, y, r) => (x === 0 || y === 0 ? 0.72 : 0.93 + r() * 0.06));
  TEX.fabric = pixTex(6, (x, y, r) => ((x + y) % 2 ? 0.86 : 0.97) - r() * 0.05);
  TEX.carpet = pixTex(7, (x, y, r) => 0.78 + r() * 0.22);
  TEX.grass = pixTex(8, (x, y, r) => (r() < 0.12 ? 0.62 : 0.8 + r() * 0.2));
  TEX.dirt = pixTex(9, (x, y, r) => 0.68 + r() * 0.32);
  TEX.metal = pixTex(10, (x, y, r) => 0.86 + (x % 4 === 0 ? 0.08 : 0) + r() * 0.04);
  TEX.paper = pixTex(11, (x, y, r) => 0.95 + r() * 0.05);
  TEX.leaf = pixTex(12, (x, y, r) => (r() < 0.22 ? 0.6 : 0.82 + r() * 0.18));
  TEX.stone = pixTex(13, (x, y, r) => (r() < 0.08 ? 0.6 : 0.78 + r() * 0.2));
  for (const k in TEX) MATS[k] = new THREE.MeshLambertMaterial({ map: TEX[k], vertexColors: true });
  MATS.glass = new THREE.MeshLambertMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.2, depthWrite: false });
  MATS.water = new THREE.MeshLambertMaterial({ color: 0x4f9fdc, transparent: true, opacity: 0.55, depthWrite: false });
  MATS.glow = new THREE.MeshBasicMaterial({ vertexColors: true });
  MATS.shadow = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
}

// ------------------------------ GÉOMÉTRIE FUSIONNÉE ------------------------------
const FACES = [
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], s: 0.82 },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], s: 0.82 },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], s: 1.0 },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], s: 0.55 },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], s: 0.92 },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], s: 0.92 },
];
const BUCKETS = {};
const _col = new THREE.Color();
const newBucket = () => ({ p: [], n: [], uv: [], c: [], i: [] });
function bucket(m) { return BUCKETS[m] || (BUCKETS[m] = newBucket()); }

function geoBox(b, x0, y0, z0, x1, y1, z1, color, texel = 1.5, jitter = true) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
  const h = [(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2];
  _col.set(color);
  const jit = jitter ? 0.95 + Math.random() * 0.1 : 1;
  const sc = 1 / (16 * texel);
  for (let f = 0; f < 6; f++) {
    const F = FACES[f], base = b.p.length / 3;
    const ax = (v) => Math.abs(v[0]) * h[0] + Math.abs(v[1]) * h[1] + Math.abs(v[2]) * h[2];
    const hn = ax(F.n), hu = ax(F.u), hv = ax(F.v);
    const fx = cx + F.n[0] * hn, fy = cy + F.n[1] * hn, fz = cz + F.n[2] * hn;
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const px = fx + F.u[0] * hu * su + F.v[0] * hv * sv;
      const py = fy + F.u[1] * hu * su + F.v[1] * hv * sv;
      const pz = fz + F.u[2] * hu * su + F.v[2] * hv * sv;
      b.p.push(px, py, pz); b.n.push(F.n[0], F.n[1], F.n[2]);
      b.uv.push((px * F.u[0] + py * F.u[1] + pz * F.u[2]) * sc, (px * F.v[0] + py * F.v[1] + pz * F.v[2]) * sc);
      const s = F.s * jit; b.c.push(_col.r * s, _col.g * s, _col.b * s);
    }
    b.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}

function geoFromBucket(b) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
  g.setIndex(b.p.length / 3 > 65000 ? new THREE.Uint32BufferAttribute(b.i, 1) : new THREE.Uint16BufferAttribute(b.i, 1));
  g.computeBoundingSphere();
  return g;
}

// Maillage autonome à partir d'une liste de boîtes [x0,y0,z0,x1,y1,z1,couleur] (coordonnées locales)
function meshBoxes(list, m = 'plain', jitter = false) {
  const b = newBucket();
  for (const q of list) geoBox(b, q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7] || TEXEL[m] || 1.5, jitter);
  return new THREE.Mesh(geoFromBucket(b), MATS[m]);
}

// ------------------------------ COLLISIONS (AABB + hachage spatial) ------------------------------
const SOLIDS = [];
const HASH = new Map();
const HC = 50;
let _stamp = 1;
const hkey = (i, j) => i * 100003 + j;
function hashOp(s, add) {
  for (let i = Math.floor(s.x0 / HC); i <= Math.floor(s.x1 / HC); i++)
    for (let j = Math.floor(s.z0 / HC); j <= Math.floor(s.z1 / HC); j++) {
      const k = hkey(i, j); let a = HASH.get(k);
      if (add) { if (!a) HASH.set(k, (a = [])); a.push(s); }
      else if (a) { const ix = a.indexOf(s); if (ix >= 0) a.splice(ix, 1); }
    }
}
function addSolid(x0, y0, z0, x1, y1, z1, tag = '', extra = null) {
  const s = { x0, y0, z0, x1, y1, z1, tag, off: false, id: SOLIDS.length };
  if (extra) Object.assign(s, extra);
  SOLIDS.push(s); hashOp(s, true);
  return s;
}
function removeSolid(s) { s.off = true; hashOp(s, false); }
function querySolids(x0, z0, x1, z1) {
  _stamp++;
  const out = [];
  for (let i = Math.floor(x0 / HC); i <= Math.floor(x1 / HC); i++)
    for (let j = Math.floor(z0 / HC); j <= Math.floor(z1 / HC); j++) {
      const a = HASH.get(hkey(i, j)); if (!a) continue;
      for (const s of a) {
        if (s._st === _stamp) continue; s._st = _stamp;
        if (s.off || s.x1 <= x0 || s.x0 >= x1 || s.z1 <= z0 || s.z0 >= z1) continue;
        out.push(s);
      }
    }
  return out;
}

// ------------------------------ RAMPES (pistes, règle) ------------------------------
const RAMPS = [];
function rampAt(r, x, z) {
  const a = r.axis === 'x' ? x : z, w = r.axis === 'x' ? z : x;
  if (w < r.w0 || w > r.w1) return null;
  if (a < Math.min(r.a0, r.a1) || a > Math.max(r.a0, r.a1)) return null;
  return r.h0 + ((r.h1 - r.h0) * (a - r.a0)) / (r.a1 - r.a0);
}

// ------------------------------ HELPERS DE CONSTRUCTION ------------------------------
const DECALS = [];
function box(x0, y0, z0, x1, y1, z1, m, c, o = {}) {
  geoBox(bucket(m), x0, y0, z0, x1, y1, z1, c, TEXEL[m] || 1.5);
  if (o.solid === false) return null;
  return addSolid(x0, y0, z0, x1, y1, z1, o.tag || '', o.extra || null);
}
const deco = (x0, y0, z0, x1, y1, z1, m, c) => box(x0, y0, z0, x1, y1, z1, m, c, { solid: false });
const glow = (x0, y0, z0, x1, y1, z1, c) => geoBox(bucket('glow'), x0, y0, z0, x1, y1, z1, c, 1, false);
function shadow(x0, z0, x1, z1, y = 0.08) { DECALS.push([x0 - 2, z0 - 2, x1 + 2, z1 + 2, y]); }
function legs4(x0, z0, x1, z1, h, w, m, c) {
  box(x0, 0, z0, x0 + w, h, z0 + w, m, c); box(x1 - w, 0, z0, x1, h, z0 + w, m, c);
  box(x0, 0, z1 - w, x0 + w, h, z1, m, c); box(x1 - w, 0, z1 - w, x1, h, z1, m, c);
}
function table(x0, z0, x1, z1, h, m, c, legW = 4) {
  box(x0, h - 3, z0, x1, h, z1, m, c);
  legs4(x0 + 2, z0 + 2, x1 - 2, z1 - 2, h - 3, legW, m, c);
  shadow(x0, z0, x1, z1);
}
// chaise : dossier sur le côté 'n','s','e','w'
function chair(x0, z0, x1, z1, seat, back, c) {
  legs4(x0 + 1, z0 + 1, x1 - 1, z1 - 1, seat - 4, 3, 'wood', c);
  box(x0, seat - 4, z0, x1, seat, z1, 'wood', c);
  const H = seat + 47;
  if (back === 'n') box(x0, seat, z0 - 4, x1, H, z0, 'wood', c);
  if (back === 's') box(x0, seat, z1, x1, H, z1 + 4, 'wood', c);
  if (back === 'w') box(x0 - 4, seat, z0, x0, H, z1, 'wood', c);
  if (back === 'e') box(x1, seat, z0, x1 + 4, H, z1, 'wood', c);
}
const BOOKCOLS = [0x8e3b46, 0x2f5d8a, 0x3f7d4e, 0xd9a441, 0x6b4c8a, 0xc75b39, 0x2d2d2d, 0xe8e2d0];
function bookPile(x0, z0, x1, z1, h, seed) {
  const r = mulberry32(seed); let y = 0;
  while (y < h - 0.2) {
    const t = Math.min(h - y, 2.5 + r() * 2.5), ins = r() * 1.5;
    box(x0 + ins * 0.3, y, z0 + ins, x1 - ins * 0.3, y + t, z1 - ins * 0.5, 'paper', BOOKCOLS[Math.floor(r() * BOOKCOLS.length)]);
    y += t;
  }
}
// rangée de livres décoratifs sur une étagère (le long de z)
function bookRow(x0, x1, y, z0, z1, seed) {
  const r = mulberry32(seed); let z = z0;
  while (z < z1 - 3) {
    const w = 2 + r() * 4, hh = 18 + r() * 18;
    if (r() < 0.85) box(x0 + r() * 3, y, z, x1, y + Math.min(hh, 40), z + w, 'paper', BOOKCOLS[Math.floor(r() * BOOKCOLS.length)]);
    z += w + 0.3;
  }
}
// mur le long d'un axe avec ouvertures {a,b,y0,y1}
const WALL_H = 250;
function wall(axis, f0, f1, s0, s1, openings, c, m = 'plaster', H = WALL_H) {
  const ops = (openings || []).slice().sort((p, q) => p.a - q.a);
  const mk = (a, b, y0, y1) => {
    if (b - a < 0.01 || y1 - y0 < 0.01) return;
    if (axis === 'x') box(a, y0, f0, b, y1, f1, m, c, { tag: 'wall' });
    else box(f0, y0, a, f1, y1, b, m, c, { tag: 'wall' });
  };
  let cur = s0;
  for (const o of ops) { mk(cur, o.a, 0, H); mk(o.a, o.b, 0, o.y0); mk(o.a, o.b, o.y1, H); cur = o.b; }
  mk(cur, s1, 0, H);
}
