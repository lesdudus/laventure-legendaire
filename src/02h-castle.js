// ------------------------------ CHÂTEAU FORT LEGO DE LÉA (chambre) ------------------------------
// Échelle Lego réelle : 1 picot = 0,8 cm, 1 brique = 0,96 cm. Le joueur (5 cm) a la taille d'une figurine.
const LG = { U: 0.8, B: 0.96, Y0: 0.32 };
const CST = {
  base: { x0: 248, x1: 330, z0: 332, z1: 413.6 },            // plaque de base (et emprise pour la navigation)
  o: { x0: 256, x1: 322, z0: 340, z1: 406 },                  // faces extérieures des courtines
  wt: 2.4, ww: 3.2, courses: 15, tw: 7.2, towerCourses: 22,   // épaisseur, chemin de ronde, hauteurs
  gate: { a: 283, b: 295, courses: 11 },
  keep: { x0: 279.4, x1: 298.6, z0: 363.4, z1: 382.6, t: 1.6, courses: 30, door: { a: 282.6, b: 295.4, courses: 12 } },
  secret: { z0: 373.8, z1: 375.4, a: 286.6, b: 291.4, courses: 7 },
  chest: { x0: 292.6, x1: 296.2, z0: 376.4, z1: 380.4 },
};
const CST_WALL_TOP = LG.Y0 + CST.courses * LG.B;      // 14,72
const CST_WALK = CST_WALL_TOP + 0.32;                  // 15,04 : sol du chemin de ronde
const LEGO_C = { gray: 0xa0a5a9, dgray: 0x6c6e68, tan: 0xe4cd9e, red: 0xc91a09, blue: 0x0055bf, moat: 0x1e88e5, green: 0x237841, yellow: 0xf2cd37, brown: 0x583927, rbrown: 0x8a4b2a, white: 0xf4f4f4, black: 0x1b2a34, gold: 0xf5c518 };
const CASTLE = { studs: [], door: null, brick: null, lid: null, flags: [], doorT: 0, lidT: 0 };

// Zone « dans le château » (cour, passage de la porte, donjon) : cachette parfaite au sol
function inCastleZone(x, y, z) {
  if (y > 12) return false;
  const o = CST.o, t = CST.wt;
  if (x > o.x0 + t && x < o.x1 - t && z > o.z0 + t && z < o.z1 - t) return true;
  return x > CST.gate.a && x < CST.gate.b && z > o.z0 - 1 && z <= o.z0 + t;
}

function legoStuds(x0, z0, x1, z1, y, c) {
  const nx = Math.max(1, Math.round((x1 - x0) / LG.U)), nz = Math.max(1, Math.round((z1 - z0) / LG.U));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) CASTLE.studs.push([x0 + ((i + 0.5) * (x1 - x0)) / nx, y, z0 + ((j + 0.5) * (z1 - z0)) / nz, c]);
}
// Rangs de briques en quinconce (2×4) le long du plus grand axe, avec trous éventuels
function legoCourses(b, x0, z0, x1, z1, yBase, n, col, holes = []) {
  const alongX = x1 - x0 >= z1 - z0, A0 = alongX ? x0 : z0, A1 = alongX ? x1 : z1;
  for (let k = 0; k < n; k++) {
    const y0 = yBase + k * LG.B, y1 = y0 + LG.B;
    for (let a = A0 - (k % 2 ? 1.6 : 0); a < A1 - 1e-6; a += 3.2) {
      let segs = [[Math.max(a, A0), Math.min(a + 3.2, A1)]];
      for (const h of holes) {
        if (y1 <= h.y0 + 1e-6 || y0 >= h.y1 - 1e-6) continue;
        segs = segs.flatMap(([p, q]) => (h.b <= p || h.a >= q ? [[p, q]] : [[p, Math.max(p, h.a)], [Math.min(q, h.b), q]]));
      }
      for (const [p, q] of segs) if (q - p > 0.05) geoBox(b, alongX ? p : x0, y0, alongX ? z0 : p, alongX ? q : x1, y1, alongX ? z1 : q, col, 1, true);
    }
  }
}
function legoSolid(x0, y0, z0, x1, y1, z1) { return addSolid(x0, y0, z0, x1, y1, z1, 'lego'); }
// Créneaux (merlons de 2×2 picots, 3 briques : plus hauts qu'une marche, ils retiennent le joueur) le long d'un segment
function merlons(b, x0, z0, x1, z1, y, col) {
  const alongX = x1 - x0 >= z1 - z0, A0 = alongX ? x0 : z0, A1 = alongX ? x1 : z1, L = A1 - A0, n = Math.max(1, Math.floor((L + 1.6) / 3.2));
  const off = A0 + (L - (n * 3.2 - 1.6)) / 2;
  for (let i = 0; i < n; i++) {
    const p = off + i * 3.2, q = p + 1.6;
    const bx0 = alongX ? p : x0, bx1 = alongX ? q : x1, bz0 = alongX ? z0 : p, bz1 = alongX ? z1 : q;
    geoBox(b, bx0, y, bz0, bx1, y + 3 * LG.B, bz1, col, 1, true);
    legoStuds(bx0, bz0, bx1, bz1, y + 3 * LG.B, col);
    legoSolid(bx0, y, bz0, bx1, y + 3 * LG.B, bz1);
  }
}
function minifig(b, x, z, ry, look) {
  const y = LG.Y0, P = [];
  const add = (a, b2, c, d, e, f, col) => P.push([a, b2, c, d, e, f, col]);
  add(-0.8, 0, -0.4, -0.05, 1.3, 0.4, look.legs); add(0.05, 0, -0.4, 0.8, 1.3, 0.4, look.legs);
  add(-0.8, 1.3, -0.4, 0.8, 1.6, 0.4, look.legs);
  add(-0.8, 1.6, -0.4, 0.8, 2.85, 0.4, look.torso); add(-1.15, 1.75, -0.3, -0.8, 2.75, 0.3, look.torso); add(0.8, 1.75, -0.3, 1.15, 2.75, 0.3, look.torso);
  add(-0.45, 2.85, -0.45, 0.45, 3.75, 0.45, LEGO_C.yellow);
  add(-0.25, 3.25, 0.45, -0.1, 3.4, 0.5, LEGO_C.black); add(0.1, 3.25, 0.45, 0.25, 3.4, 0.5, LEGO_C.black);
  if (look.helmet) { add(-0.55, 3.45, -0.55, 0.55, 4.05, 0.55, look.helmet); add(-0.08, 2.95, 0.5, 0.08, 3.6, 0.6, look.helmet); }
  if (look.crown) { add(-0.5, 3.75, -0.5, 0.5, 4.05, 0.5, LEGO_C.gold); for (const [cx, cz] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) add(cx - 0.1, 4.05, cz - 0.1, cx + 0.1, 4.35, cz + 0.1, LEGO_C.gold); }
  if (look.shield) add(-0.7, 1.5, 0.45, 0.7, 3.1, 0.6, look.shield);
  const c = Math.cos(ry), s = Math.sin(ry);
  for (const q of P) {
    // rotation par quarts de tour (ry multiple de PI/2) : on tourne les coins puis on remet en ordre
    const ax = x + q[0] * c + q[2] * s, az = z - q[0] * s + q[2] * c, bx = x + q[3] * c + q[5] * s, bz = z - q[3] * s + q[5] * c;
    geoBox(b, Math.min(ax, bx), y + q[1], Math.min(az, bz), Math.max(ax, bx), y + q[4], Math.max(az, bz), q[6], 1, false);
  }
  legoSolid(x - 0.9, y, z - 0.9, x + 0.9, y + 4, z + 0.9);
}
function flagTexture(kind) {
  const c = document.createElement('canvas'); c.width = 96; c.height = 64;
  const g = c.getContext('2d');
  if (kind === 'tricolore') { g.fillStyle = '#0055a4'; g.fillRect(0, 0, 32, 64); g.fillStyle = '#ffffff'; g.fillRect(32, 0, 32, 64); g.fillStyle = '#ef4135'; g.fillRect(64, 0, 32, 64); }
  else {
    g.fillStyle = '#1d3f9e'; g.fillRect(0, 0, 96, 64); g.fillStyle = '#f5c518';
    const lys = (cx, cy, k) => {
      g.beginPath(); g.moveTo(cx, cy - 12 * k); g.quadraticCurveTo(cx + 5 * k, cy - 4 * k, cx, cy + 4 * k); g.quadraticCurveTo(cx - 5 * k, cy - 4 * k, cx, cy - 12 * k); g.fill();
      for (const sgn of [-1, 1]) { g.beginPath(); g.moveTo(cx + sgn * 1.5 * k, cy); g.quadraticCurveTo(cx + sgn * 11 * k, cy - 8 * k, cx + sgn * 7 * k, cy + 6 * k); g.quadraticCurveTo(cx + sgn * 5 * k, cy + 1 * k, cx + sgn * 1.5 * k, cy + 3 * k); g.fill(); }
      g.fillRect(cx - 6 * k, cy + 3 * k, 12 * k, 2.5 * k); g.beginPath(); g.moveTo(cx - 2 * k, cy + 5 * k); g.lineTo(cx + 2 * k, cy + 5 * k); g.lineTo(cx, cy + 11 * k); g.fill();
    };
    lys(48, 30, 1.6);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function addFlag(x, y, z, kind, w = 6, h = 4) {
  const S = W.scene, pole = meshBoxes([[x - 0.16, y, z - 0.16, x + 0.16, y + h + 6, z + 0.16, LEGO_C.dgray]], 'plain'); S.add(pole);
  const geo = new THREE.PlaneGeometry(w, h, 6, 1); geo.translate(w / 2, 0, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: flagTexture(kind), side: THREE.DoubleSide }));
  m.position.set(x + 0.16, y + h / 2 + 5.8 - h / 2 + 0.2, z); S.add(m);
  CASTLE.flags.push({ m, base: geo.attributes.position.array.slice(), ph: Math.random() * 6 });
}
function leaDrawingTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 180;
  const g = c.getContext('2d');
  g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, 256, 180);
  g.lineWidth = 4; g.lineCap = 'round'; g.strokeStyle = '#6d6d6d';
  g.strokeRect(40, 50, 130, 100); for (const [x, y] of [[30, 40], [150, 40], [30, 130], [150, 130]]) g.strokeRect(x, y, 30, 30);
  g.strokeStyle = '#8e44ad'; g.strokeRect(85, 75, 40, 50);
  g.strokeStyle = '#2b7bd6'; g.lineWidth = 6; g.strokeRect(18, 28, 174, 134);
  g.strokeStyle = '#e53935'; g.lineWidth = 6; g.beginPath(); g.moveTo(96, 92); g.lineTo(114, 110); g.moveTo(114, 92); g.lineTo(96, 110); g.stroke();
  g.strokeStyle = '#f5b700'; g.lineWidth = 4; g.beginPath(); g.moveTo(200, 70); g.quadraticCurveTo(170, 80, 122, 100); g.stroke();
  g.fillStyle = '#f5c518'; g.fillRect(196, 58, 20, 12);
  g.fillStyle = '#e53935'; g.font = 'bold 20px "Comic Sans MS", "Segoe Print", cursive'; g.fillText('TRÉZOR', 176, 112); g.fillText('DU ROI', 178, 134);
  g.fillStyle = '#2b7bd6'; g.font = 'bold 15px "Comic Sans MS", "Segoe Print", cursive'; g.fillText('chut !', 196, 160); g.fillText('Léa', 8, 172);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function buildLegoCastle() {
  const S = W.scene, b = newBucket(), C = LEGO_C, Y0 = LG.Y0, o = CST.o, t = CST.wt, tw = CST.tw;
  CASTLE.studs.length = 0;
  // plaque de base verte et douves en tuiles bleues
  const B = CST.base;
  geoBox(b, B.x0, 0, B.z0, B.x1, Y0, B.z1, C.green, 1, false); legoSolid(B.x0, 0, B.z0, B.x1, Y0, B.z1);
  const mo = { x0: 249, x1: 329, z0: 333, z1: 412.6 }, mi = { x0: 254, x1: 324, z0: 338, z1: 408 };
  for (const r of [[mo.x0, mo.z0, mo.x1, mi.z0], [mo.x0, mi.z1, mo.x1, mo.z1], [mo.x0, mi.z0, mi.x0, mi.z1], [mi.x1, mi.z0, mo.x1, mi.z1]]) {
    geoBox(b, r[0], Y0, r[1], r[2], Y0 + 0.32, r[3], C.moat, 1, true); legoSolid(r[0], Y0, r[1], r[2], Y0 + 0.32, r[3]);
  }
  geoBox(b, mi.x0, Y0, mi.z0, mi.x1, Y0 + 0.05, mi.z1, C.gray, 1, false);
  // pont-levis abaissé + poteaux
  geoBox(b, CST.gate.a, Y0 + 0.32, 332.6, CST.gate.b, Y0 + 0.64, o.z0, C.rbrown, 1, false); legoSolid(CST.gate.a, Y0 + 0.32, 332.6, CST.gate.b, Y0 + 0.64, o.z0);
  for (let z = 333.4; z < o.z0; z += 1.6) geoBox(b, CST.gate.a, Y0 + 0.64, z, CST.gate.b, Y0 + 0.7, z + 0.15, C.brown, 1, false);
  for (const x of [CST.gate.a - 1.6, CST.gate.b]) { geoBox(b, x, Y0, 336.2, x + 1.6, Y0 + 5 * LG.B, 337.8, C.dgray, 1, true); legoStuds(x, 336.2, x + 1.6, 337.8, Y0 + 5 * LG.B, C.dgray); legoSolid(x, Y0, 336.2, x + 1.6, Y0 + 5 * LG.B, 337.8); }

  // courtines (entre les tours) + chemin de ronde + créneaux
  const gateH = { a: CST.gate.a, b: CST.gate.b, y0: Y0, y1: Y0 + CST.gate.courses * LG.B };
  const walls = [
    { side: 'n', r: [o.x0 + tw, o.z0, o.x1 - tw, o.z0 + t], walk: [o.x0 + tw, o.z0, o.x1 - tw, o.z0 + t + CST.ww], mer: [o.x0 + tw, o.z0, o.x1 - tw, o.z0 + 1.6], holes: [gateH] },
    { side: 's', r: [o.x0 + tw, o.z1 - t, o.x1 - tw, o.z1], walk: [o.x0 + tw, o.z1 - t - CST.ww, o.x1 - tw, o.z1], mer: [o.x0 + tw, o.z1 - 1.6, o.x1 - tw, o.z1], holes: [] },
    { side: 'w', r: [o.x0, o.z0 + tw, o.x0 + t, o.z1 - tw], walk: [o.x0, o.z0 + tw, o.x0 + t + CST.ww, o.z1 - tw], mer: [o.x0, o.z0 + tw, o.x0 + 1.6, o.z1 - tw], holes: [] },
    { side: 'e', r: [o.x1 - t, o.z0 + tw, o.x1, o.z1 - tw], walk: [o.x1 - t - CST.ww, o.z0 + tw, o.x1, o.z1 - tw], mer: [o.x1 - 1.6, o.z0 + tw, o.x1, o.z1 - tw], holes: [] },
  ];
  for (const w of walls) {
    const [x0, z0, x1, z1] = w.r;
    legoCourses(b, x0, z0, x1, z1, Y0, CST.courses, C.gray, w.holes);
    if (w.holes.length) {
      const h = w.holes[0];
      legoSolid(x0, Y0, z0, h.a, CST_WALL_TOP, z1); legoSolid(h.b, Y0, z0, x1, CST_WALL_TOP, z1); legoSolid(h.a, h.y1, z0, h.b, CST_WALL_TOP, z1);
    } else legoSolid(x0, Y0, z0, x1, CST_WALL_TOP, z1);
    const [wx0, wz0, wx1, wz1] = w.walk;
    geoBox(b, wx0, CST_WALL_TOP, wz0, wx1, CST_WALK, wz1, C.dgray, 1, false); legoSolid(wx0, CST_WALL_TOP, wz0, wx1, CST_WALK, wz1);
    merlons(b, w.mer[0], w.mer[1], w.mer[2], w.mer[3], CST_WALK, C.gray);
  }
  // piliers sous le chemin de ronde (bord intérieur)
  const pil = (x, z) => { geoBox(b, x - 0.8, Y0, z - 0.8, x + 0.8, CST_WALL_TOP, z + 0.8, C.dgray, 1, true); legoSolid(x - 0.8, Y0, z - 0.8, x + 0.8, CST_WALL_TOP, z + 0.8); };
  const ein = { n: o.z0 + t + CST.ww - 0.8, s: o.z1 - t - CST.ww + 0.8, w: o.x0 + t + CST.ww - 0.8, e: o.x1 - t - CST.ww + 0.8 };
  for (const x of [270, 278, 300, 308]) pil(x, ein.n);
  for (const x of [270, 282, 296, 308]) pil(x, ein.s);
  for (const z of [352, 364, 396]) pil(ein.w, z);
  for (const z of [352, 364, 382, 394]) pil(ein.e, z);
  // herse relevée au-dessus de la porte
  for (let x = CST.gate.a + 0.6; x < CST.gate.b; x += 1.6) geoBox(b, x, gateH.y1 - 2.6, o.z0 + 1.0, x + 0.3, gateH.y1, o.z0 + 1.4, C.black, 1, false);
  for (const y of [gateH.y1 - 2.2, gateH.y1 - 0.9]) geoBox(b, CST.gate.a, y, o.z0 + 1.0, CST.gate.b, y + 0.3, o.z0 + 1.4, C.black, 1, false);
  // bannières tricolores de part et d'autre de la porte
  for (const x of [CST.gate.a - 6.4, CST.gate.b + 2.8]) {
    geoBox(b, x, 6, o.z0 - 0.12, x + 1.2, 14, o.z0, 0x0055a4, 1, false); geoBox(b, x + 1.2, 6, o.z0 - 0.12, x + 2.4, 14, o.z0, 0xffffff, 1, false); geoBox(b, x + 2.4, 6, o.z0 - 0.12, x + 3.6, 14, o.z0, 0xef4135, 1, false);
  }

  // tours d'angle (pleines, sommet accessible en sautant depuis le chemin de ronde)
  const towerTop = Y0 + CST.towerCourses * LG.B, towerFloor = towerTop + 0.32;
  for (const [cx, cz] of [[o.x0, o.z0], [o.x1, o.z0], [o.x0, o.z1], [o.x1, o.z1]]) {
    const x0 = cx - tw, x1 = cx + tw, z0 = cz - tw, z1 = cz + tw;
    legoCourses(b, x0, z0, x1, z0 + 0.8, Y0, CST.towerCourses, C.gray); legoCourses(b, x0, z1 - 0.8, x1, z1, Y0, CST.towerCourses, C.gray);
    legoCourses(b, x0, z0 + 0.8, x0 + 0.8, z1 - 0.8, Y0, CST.towerCourses, C.gray); legoCourses(b, x1 - 0.8, z0 + 0.8, x1, z1 - 0.8, Y0, CST.towerCourses, C.gray);
    geoBox(b, x0, towerTop, z0, x1, towerFloor, z1, C.dgray, 1, false);
    legoSolid(x0, Y0, z0, x1, towerFloor, z1);
    merlons(b, x0, z0, x1, z0 + 1.6, towerFloor, C.gray); merlons(b, x0, z1 - 1.6, x1, z1, towerFloor, C.gray);
    merlons(b, x0, z0 + 1.6, x0 + 1.6, z1 - 1.6, towerFloor, C.gray); merlons(b, x1 - 1.6, z0 + 1.6, x1, z1 - 1.6, towerFloor, C.gray);
    for (const [ax, az, bx, bz] of [[cx - 0.4, z0 - 0.06, cx + 0.4, z0], [cx - 0.4, z1, cx + 0.4, z1 + 0.06], [x0 - 0.06, cz - 0.4, x0, cz + 0.4], [x1, cz - 0.4, x1 + 0.06, cz + 0.4]]) geoBox(b, ax, 9, az, bx, 12, bz, C.black, 1, false);
    addFlag(cx, towerFloor, cz, 'lys');
  }

  // donjon central creux, avec porte, mur secret et salle au trésor
  const K = CST.keep, kt = K.t, kTop = Y0 + K.courses * LG.B, kd = K.door, kdH = { a: kd.a, b: kd.b, y0: Y0, y1: Y0 + kd.courses * LG.B };
  legoCourses(b, K.x0, K.z0, K.x1, K.z0 + kt, Y0, K.courses, C.tan, [kdH]);
  legoCourses(b, K.x0, K.z1 - kt, K.x1, K.z1, Y0, K.courses, C.tan);
  legoCourses(b, K.x0, K.z0 + kt, K.x0 + kt, K.z1 - kt, Y0, K.courses, C.tan);
  legoCourses(b, K.x1 - kt, K.z0 + kt, K.x1, K.z1 - kt, Y0, K.courses, C.tan);
  legoSolid(K.x0, Y0, K.z0, kd.a, kTop, K.z0 + kt); legoSolid(kd.b, Y0, K.z0, K.x1, kTop, K.z0 + kt); legoSolid(kd.a, kdH.y1, K.z0, kd.b, kTop, K.z0 + kt);
  legoSolid(K.x0, Y0, K.z1 - kt, K.x1, kTop, K.z1); legoSolid(K.x0, Y0, K.z0 + kt, K.x0 + kt, kTop, K.z1 - kt); legoSolid(K.x1 - kt, Y0, K.z0 + kt, K.x1, kTop, K.z1 - kt);
  merlons(b, K.x0, K.z0, K.x1, K.z0 + 1.6, kTop, C.tan); merlons(b, K.x0, K.z1 - 1.6, K.x1, K.z1, kTop, C.tan);
  merlons(b, K.x0, K.z0 + 1.6, K.x0 + 1.6, K.z1 - 1.6, kTop, C.tan); merlons(b, K.x1 - 1.6, K.z0 + 1.6, K.x1, K.z1 - 1.6, kTop, C.tan);
  for (const y of [16, 22]) for (const x of [283.6, 294.4]) geoBox(b, x - 0.4, y, K.z0 - 0.06, x + 0.4, y + 3, K.z0, C.black, 1, false);
  geoBox(b, K.x0 + kt, Y0, K.z0 + kt, K.x1 - kt, Y0 + 0.05, K.z1 - kt, C.rbrown, 1, false);
  addFlag(289, kTop + 3 * LG.B, 373, 'tricolore', 8, 5);
  // mur secret (la partie centrale est une porte coulissante)
  const sc = CST.secret, scH = { a: sc.a, b: sc.b, y0: Y0, y1: Y0 + sc.courses * LG.B };
  legoCourses(b, K.x0 + kt, sc.z0, K.x1 - kt, sc.z1, Y0, K.courses, C.tan, [scH]);
  legoSolid(K.x0 + kt, Y0, sc.z0, sc.a, kTop, sc.z1); legoSolid(sc.b, Y0, sc.z0, K.x1 - kt, kTop, sc.z1); legoSolid(sc.a, scH.y1, sc.z0, sc.b, kTop, sc.z1);
  {
    const db = newBucket();
    legoCourses(db, sc.a + 0.05, sc.z0 + 0.06, sc.b - 0.05, sc.z1 - 0.06, Y0, sc.courses, C.tan);
    const door = new THREE.Mesh(geoFromBucket(db), new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 40, specular: 0x222222 }));
    const brick = new THREE.Mesh(new THREE.BoxGeometry(1.6, LG.B, 0.9), new THREE.MeshLambertMaterial({ color: C.gold, emissive: 0x5a4300 }));
    brick.position.set(289, Y0 + 3.5 * LG.B, sc.z0 - 0.05);
    const grp = new THREE.Group(); grp.add(door, brick); S.add(grp);
    CASTLE.door = { grp, brick, solid: legoSolid(sc.a + 0.05, Y0, sc.z0, sc.b - 0.05, scH.y1, sc.z1) };
  }
  // trésor : coffre « cubique » (clin d'œil) + pièces d'or
  {
    const ch = CST.chest, h = 2.6, cb = newBucket();
    geoBox(cb, ch.x0, Y0, ch.z0, ch.x1, Y0 + h * 0.62, ch.z1, 0x9c6b30, 1, false);
    geoBox(cb, ch.x0 - 0.05, Y0 + h * 0.55, ch.z0 - 0.05, ch.x1 + 0.05, Y0 + h * 0.62, ch.z1 + 0.05, 0x4a3018, 1, false);
    geoBox(cb, ch.x0 - 0.12, Y0 + h * 0.42, (ch.z0 + ch.z1) / 2 - 0.35, ch.x0, Y0 + h * 0.7, (ch.z0 + ch.z1) / 2 + 0.35, 0xbfc5ca, 1, false);
    S.add(new THREE.Mesh(geoFromBucket(cb), new THREE.MeshLambertMaterial({ vertexColors: true })));
    const lb = newBucket();
    geoBox(lb, 0, 0, -(ch.z1 - ch.z0) / 2, ch.x1 - ch.x0, h * 0.38, (ch.z1 - ch.z0) / 2, 0xa8763a, 1, false);
    const lid = new THREE.Mesh(geoFromBucket(lb), new THREE.MeshLambertMaterial({ vertexColors: true }));
    const piv = new THREE.Group(); piv.position.set(ch.x1, Y0 + h * 0.62, (ch.z0 + ch.z1) / 2); lid.position.x = -(ch.x1 - ch.x0); piv.add(lid); S.add(piv);
    CASTLE.lid = piv; legoSolid(ch.x0, Y0, ch.z0, ch.x1, Y0 + h, ch.z1);
    for (let i = 0; i < 9; i++) { const x = 283 + (i * 37) % 9, z = 376.4 + ((i * 53) % 40) / 10; geoBox(b, x, Y0, z, x + 0.6, Y0 + 0.2 + (i % 3) * 0.2, z + 0.6, C.gold, 1, false); }
  }
  // escalier vers le chemin de ronde (marches de 1,84 cm : on monte en marchant)
  const sx0 = o.x0 + t + CST.ww, sx1 = sx0 + 4.8;
  for (let k = 0; k < 8; k++) {
    const top = Y0 + ((k + 1) * (CST_WALK - Y0)) / 8, z1 = 392 - k * 2.4, z0 = z1 - 2.4;
    geoBox(b, sx0, Y0, z0, sx1, top, z1, k % 2 ? C.dgray : C.gray, 1, true); legoStuds(sx0, z0, sx1, z1, top, k % 2 ? C.dgray : C.gray);
    legoSolid(sx0, Y0, z0, sx1, top, z1);
  }
  // figurines : chevalier à la porte, roi dans le donjon
  minifig(b, 289 - 7.5, 348, 0, { legs: 0x2b2b2b, torso: C.blue, helmet: C.dgray, shield: C.blue });
  minifig(b, 289 + 7.5, 348, 0, { legs: 0x2b2b2b, torso: C.red, helmet: C.dgray, shield: C.red });
  minifig(b, 284.2, 369.4, 0, { legs: 0x5c2d91, torso: 0x5c2d91, crown: true });
  // briques éparpillées autour (Léa est en train de construire)
  const loose = [[232, 316, 3.2, 1.6, C.red], [236, 320, 1.6, 3.2, C.yellow], [244, 313, 3.2, 1.6, C.blue], [262, 322, 3.2, 1.6, C.gray], [266, 318, 1.6, 1.6, C.green],
    [276, 326, 3.2, 1.6, C.tan], [312, 322, 1.6, 3.2, C.red], [310, 312, 3.2, 1.6, C.white], [300, 328, 1.6, 1.6, C.blue], [240, 328, 3.2, 1.6, C.gray], [228, 324, 1.6, 1.6, C.yellow], [258, 312, 1.6, 3.2, C.red]];
  for (const [x, z, w, d, col] of loose) { geoBox(b, x, 0.8, z, x + w, 0.8 + LG.B, z + d, col, 1, false); legoStuds(x, z, x + w, z + d, 0.8 + LG.B, col); }
  geoBox(b, 236, 0.8 + LG.B, 320, 237.6, 0.8 + 2 * LG.B, 323.2, C.blue, 1, false); legoStuds(236, 320, 237.6, 323.2, 0.8 + 2 * LG.B, C.blue);
  // dessin de Léa (indice) posé sur le tapis
  {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(24, 17), new THREE.MeshLambertMaterial({ map: leaDrawingTexture() }));
    m.rotation.set(-Math.PI / 2, 0, 0.18); m.position.set(262, 0.84, 300); S.add(m);
    CASTLE.drawing = { x: 262, y: 0.8, z: 300 };
  }
  // maillage fusionné + picots instanciés
  const mesh = new THREE.Mesh(geoFromBucket(b), new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 40, specular: 0x222222 }));
  S.add(mesh);
  const sg = new THREE.CylinderGeometry(0.24, 0.24, 0.17, 10, 1, false); sg.translate(0, 0.085, 0);
  const studs = new THREE.InstancedMesh(sg, new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 40, specular: 0x222222 }), CASTLE.studs.length);
  const mtx = new THREE.Matrix4(), col = new THREE.Color();
  CASTLE.studs.forEach(([x, y, z, c], i) => { mtx.makeTranslation(x, y, z); studs.setMatrixAt(i, mtx); studs.setColorAt(i, col.setHex(c)); });
  studs.instanceMatrix.needsUpdate = true; if (studs.instanceColor) studs.instanceColor.needsUpdate = true; studs.computeBoundingSphere();
  S.add(studs);
  W.zones.castle = { x0: o.x0, x1: o.x1, z0: o.z0, z1: o.z1 };
  shadow(B.x0, B.z0, B.x1, B.z1);
}

// Les humains, Rex et Moustache contournent le château (toute l'emprise de la plaque)
function markCastleNav(grids) { for (const g of grids) if (g) g.mark(CST.base, 1); }

// ---------- secret & trésor ----------
function castleInteracts() {
  const L = [];
  if (!CASTLE.drawing) return L;
  L.push({ ...CASTLE.drawing, r: 14, label: '🖍️ Regarder le dessin de Léa', act: () => UI.dialog('🖍️ Dessin de Léa', 'Un dessin au feutre : le château fort, avec une grosse croix rouge sur la tour du milieu et une flèche vers une petite brique jaune. En lettres maladroites : « TRÉZOR DU ROI — chut ! »', [{ label: 'Intéressant…' }]) });
  const sc = CST.secret;
  if (!G.flags.legoDoor) L.push({ x: 289, y: LG.Y0, z: sc.z0 - 1.6, r: 6, label: 'Pousser la brique dorée qui bouge…', act: openLegoSecret });
  else if (!G.flags.legoChest) L.push({ x: CST.chest.x0 - 1.6, y: LG.Y0, z: (CST.chest.z0 + CST.chest.z1) / 2, r: 6, label: '👑 Ouvrir le coffre au trésor du roi', act: lootLegoChest });
  return L;
}
function openLegoSecret() {
  G.flags.legoDoor = true; removeSolid(CASTLE.door.solid); CASTLE.doorT = 0.001;
  SFX.play('door'); SFX.play('quest');
  toast('Clic… clac ! La brique dorée s’enfonce et un pan de mur coulisse : un passage secret dans le donjon !', 'success');
  emitNoise(289, 2, 374, 60, 0.15, 'joueur');
}
function lootLegoChest() {
  G.flags.legoChest = true; CASTLE.lidT = 0.001;
  giveItem('couronne', 1); giveItem('diamant', 2); giveItem('pomme_or', 1); giveItem('bonbon', 2);
  G.stars = (G.stars || 0) + 1; SFX.play('quest'); Missions.event('legoTreasure');
  UI.dialog('👑 Le trésor du roi Lego', 'Le coffre grince en s’ouvrant… Dedans : la couronne du roi, 2 diamants, une pomme dorée et 2 bonbons ! Avec la couronne dans ton inventaire, les humains t’oublient deux fois plus vite. (+1 ⭐)', [{ label: 'Vive le roi !' }]);
}
// État visuel selon la sauvegarde (porte ouverte, coffre ouvert)
function refreshCastle() {
  const D = CASTLE.door; if (!D) return;
  const open = !!G.flags.legoDoor;
  if (open && !D.solid.off) removeSolid(D.solid);
  else if (!open && D.solid.off) { D.solid.off = false; hashOp(D.solid, true); }
  D.grp.position.x = open ? CST.secret.b - CST.secret.a : 0; CASTLE.doorT = 0;
  CASTLE.lid.rotation.z = G.flags.legoChest ? -1.9 : 0; CASTLE.lidT = 0;
}
function updateCastle(dt) {
  if (!CASTLE.door) return;
  const D = CASTLE.door, P = G.p, w = CST.secret.b - CST.secret.a;
  if (CASTLE.doorT > 0) { CASTLE.doorT = Math.min(1, CASTLE.doorT + dt * 0.8); D.grp.position.x = w * CASTLE.doorT; if (CASTLE.doorT >= 1) CASTLE.doorT = 0; }
  if (CASTLE.lidT > 0) { CASTLE.lidT = Math.min(1, CASTLE.lidT + dt * 1.5); CASTLE.lid.rotation.z = -1.9 * CASTLE.lidT; if (CASTLE.lidT >= 1) CASTLE.lidT = 0; }
  // la brique dorée tremble quand on s'approche
  const near = !G.flags.legoDoor && dist2(P.x, P.z, 289, CST.secret.z0) < 22;
  D.brick.rotation.y = near ? Math.sin(G.simT * 18) * 0.06 : 0;
  D.brick.position.z = G.flags.legoDoor ? CST.secret.z0 + 0.6 : CST.secret.z0 - 0.05 - (near ? 0.12 + Math.sin(G.simT * 9) * 0.05 : 0);
  // drapeaux au vent
  for (const f of CASTLE.flags) {
    const a = f.m.geometry.attributes.position, arr = a.array;
    for (let i = 0; i < arr.length; i += 3) arr[i + 2] = f.base[i + 2] + Math.sin(G.simT * 3 + f.ph + f.base[i] * 0.9) * 0.08 * f.base[i];
    a.needsUpdate = true;
  }
  // Léa joue : indice glissé à voix haute, une fois par jour, si on est dans la chambre
  const lea = HUMANS.find((h) => h.id === 'lea');
  if (lea && lea.act === 'l_lego' && lea.arrived && lea.state === 'routine' && G.flags.legoHintDay !== G.day && !G.flags.legoDoor) {
    const room = roomAt(P.x, P.z);
    if (room && room.id === 'chambre' && dist2(P.x, P.z, lea.x, lea.z) < 220) {
      G.flags.legoHintDay = G.day;
      toast('🏰 Léa (en jouant) : « …et le roi cacha son trésor derrière la brique qui brille, tout au fond du donjon ! »', 'info');
    }
  }
}
