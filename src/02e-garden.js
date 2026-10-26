// ------------------------------ JARDIN, RAMPES, FINALISATION ------------------------------
const PATH_STONES = [];
function buildGarden() {
  const FEN = 0xa4794c;
  box(-300, -3, 862, 1500, 0, 1900, 'grass', 0x6aa84f, { tag: 'floor' });
  // clôture
  box(-110, 0, 850, -100, 120, 1660, 'wood', FEN, { tag: 'wall' }); box(1300, 0, 850, 1310, 120, 1660, 'wood', FEN, { tag: 'wall' });
  box(-110, 0, 1650, 1310, 120, 1660, 'wood', FEN, { tag: 'wall' });
  box(-110, 0, 850, -12, 120, 862, 'wood', FEN, { tag: 'wall' }); box(1212, 0, 850, 1310, 120, 862, 'wood', FEN, { tag: 'wall' });
  for (let x = -100; x < 1300; x += 25) deco(x, 120, 1648, x + 20, 128, 1650, 'wood', 0xb88a5a);
  for (let z = 870; z < 1650; z += 25) { deco(-100, 120, z, -98, 128, z + 20, 'wood', 0xb88a5a); deco(1298, 120, z, 1300, 128, z + 20, 'wood', 0xb88a5a); }
  // terrasse + pas japonais vers la cabane
  box(850, 0, 862, 1212, 1.2, 1000, 'stone', 0xb9b2a5, { tag: 'patio' });
  for (let i = 0; i < 9; i++) {
    const z = 1015 + i * 42, x = 1045 + Math.sin(i * 0.7) * 25;
    box(x - 15, 0, z - 11, x + 15, 1.5, z + 11, 'stone', 0x9e9e96, { tag: 'patio' });
    PATH_STONES.push({ x, z });
  }
  // potager (fraises)
  box(100, 0, 1150, 400, 20, 1154, 'wood', 0x8d6e63); box(100, 0, 1246, 400, 20, 1250, 'wood', 0x8d6e63);
  box(100, 0, 1154, 104, 20, 1246, 'wood', 0x8d6e63); box(396, 0, 1154, 400, 20, 1246, 'wood', 0x8d6e63);
  box(104, 0, 1154, 396, 17, 1246, 'dirt', 0x6b4a2e, { tag: 'soil' });
  for (let i = 0; i < 10; i++) {
    const x = 125 + i * 28, z = 1175 + (i % 2) * 45;
    deco(x - 7, 17, z - 7, x + 7, 24, z + 7, 'leaf', 0x2e7d32); deco(x - 3, 24, z - 3, x + 3, 28, z + 3, 'leaf', 0x388e3c);
    deco(x + 3, 17, z + 4, x + 6, 20, z + 7, 'plain', 0xd32f2f);
  }
  // tournesol
  box(498, 0, 1298, 503, 170, 1303, 'leaf', 0x558b2f);
  deco(503, 80, 1299, 520, 83, 1305, 'leaf', 0x689f38); deco(480, 120, 1298, 498, 123, 1304, 'leaf', 0x689f38);
  deco(478, 160, 1291, 522, 202, 1296, 'plain', 0xf9c80e); deco(488, 170, 1289, 512, 192, 1291, 'dirt', 0x5d3a1a);
  // fourmilière
  box(220, 0, 1480, 280, 6, 1540, 'dirt', 0x8d6748); box(230, 6, 1490, 270, 12, 1530, 'dirt', 0x8d6748); box(240, 12, 1500, 260, 17, 1520, 'dirt', 0x8d6748);
  deco(247, 17, 1507, 253, 17.3, 1513, 'dirt', 0x2b1d12);
  // myrtillier
  box(700, 0, 1540, 740, 50, 1580, 'leaf', 0x2e6b30);
  for (const [x, z, s] of [[690, 1530, 22], [745, 1550, 20], [715, 1585, 18], [705, 1555, 26]]) deco(x - s / 2, 10, z - s / 2, x + s / 2, 10 + s * 2, z + s / 2, 'leaf', 0x356f35);
  for (let i = 0; i < 9; i++) deco(694 + (i * 7) % 50, 18 + (i * 13) % 35, 1532 + (i * 11) % 50, 697 + (i * 7) % 50, 21 + (i * 13) % 35, 1535 + (i * 11) % 50, 'plain', 0x3b4cc0);
  // table de jardin + escalier de pots
  table(600, 1000, 720, 1080, 72, 'plain', 0xf5f5f5);
  for (const [x0, h] of [[488, 15], [516, 30], [544, 45], [572, 60]]) {
    box(x0, 0, 1030, x0 + 26, h - 2, 1056, 'dirt', 0xc0673d); box(x0 + 1, h - 2, 1031, x0 + 25, h, 1055, 'dirt', 0x5d4037);
    deco(x0 + 10, h, 1040, x0 + 16, h + 8, 1046, 'leaf', 0x43a047);
  }
  box(760, 0, 950, 790, 25, 975, 'metal', 0x2e7d32); deco(790, 15, 958, 812, 18, 966, 'metal', 0x2e7d32);
  box(900, 1.2, 866, 940, 10, 892, 'plain', 0x388e3c);
  // flaques
  W.puddles.push({ x: 300, z: 1000, r: 22, room: 'jardin' }, { x: 900, z: 1250, r: 26, room: 'jardin' });
  waterQuad(280, 985, 320, 1015, 0.15); waterQuad(875, 1232, 925, 1268, 0.15);
  // cabane (but final : la lucarne du toit)
  const SH = 0x8d6e4f;
  wall('x', 1380, 1385, 950, 1200, [{ a: 1060, b: 1072, y0: 0, y1: 10 }, { a: 1108, b: 1120, y0: 0, y1: 10 }, { a: 1172, b: 1194, y0: 150, y1: 182 }], SH, 'wood', 200);
  box(950, 0, 1595, 1200, 200, 1600, 'wood', SH, { tag: 'wall' });
  box(950, 0, 1385, 955, 200, 1595, 'wood', SH, { tag: 'wall' }); box(1195, 0, 1385, 1200, 200, 1595, 'wood', SH, { tag: 'wall' });
  // toit plat percé d'une lucarne
  const R = 0x5d4037;
  box(945, 200, 1375, 1205, 206, 1475, 'wood', R); box(945, 200, 1505, 1205, 206, 1605, 'wood', R);
  box(945, 200, 1475, 1060, 206, 1505, 'wood', R); box(1090, 200, 1475, 1205, 206, 1505, 'wood', R);
  deco(1056, 206, 1471, 1094, 210, 1475, 'wood', 0xf5f5f5); deco(1056, 206, 1505, 1094, 210, 1509, 'wood', 0xf5f5f5);
  deco(1056, 206, 1475, 1060, 210, 1505, 'wood', 0xf5f5f5); deco(1090, 206, 1475, 1094, 210, 1505, 'wood', 0xf5f5f5);
  // vitre de la lucarne : on marche dessus, mais l'avion en papier passe par la fente entrouverte
  geoBox(bucket('glassB'), 1060, 205.4, 1475, 1090, 206, 1505, 0xffffff, 1, false); addSolid(1060, 205.4, 1475, 1090, 206, 1505, 'glass');
  // récupérateur d'eau de pluie contre la cabane : marchepied de Moustache (sol → 100 → toit 206)
  box(1150, 0, 1330, 1188, 100, 1368, 'plain', 0x2e6b3f);
  deco(1149.5, 20, 1329.5, 1188.5, 23, 1368.5, 'metal', 0x5f6b62); deco(1149.5, 75, 1329.5, 1188.5, 78, 1368.5, 'metal', 0x5f6b62);
  deco(1155, 100, 1335, 1183, 100.6, 1363, 'plain', 0x1f4a2b);
  deco(1165, 100.6, 1366, 1171, 206, 1372, 'metal', 0x9e9e9e); deco(1165, 200, 1366, 1171, 204, 1378, 'metal', 0x9e9e9e);
  shadow(1150, 1330, 1188, 1368);
  deco(1020, 0, 1379, 1100, 180, 1380, 'wood', 0x6d4c41); deco(1088, 85, 1377, 1094, 95, 1379, 'metal', 0xd4af37);
  box(955, 0, 1385, 1195, 1, 1595, 'wood', 0x795548);
  // la colonie (intérieur)
  for (const [x, z, c] of [[1000, 1450, 0xc0392b], [1130, 1440, 0x2f5d8a], [1010, 1540, 0x3f7d4e], [1140, 1545, 0xd9a441]]) {
    box(x, 1, z, x + 30, 16, z + 20, 'paper', c); deco(x + 2, 16, z - 1, x + 28, 20, z + 21, 'wood', 0x6d4c41);
    glow(x + 12, 5, z + 20, x + 18, 11, z + 20.3, 0xffe082);
  }
  glow(1072, 1, 1495, 1078, 5, 1501, 0xff8f00);
  for (let i = 0; i < 14; i++) glow(980 + i * 15, 60 + Math.sin(i) * 5, 1490, 982 + i * 15, 62 + Math.sin(i) * 5, 1492, [0xff5252, 0xffeb3b, 0x69f0ae, 0x40c4ff][i % 4]);
  W.zones.skylight = { x0: 1058, x1: 1092, z0: 1473, z1: 1507, y0: 185, y1: 280 };
  W.zones.shedInside = { x0: 955, x1: 1195, z0: 1385, z1: 1595 };
  W.spots.colony = { x: 1075, y: 1, z: 1490 };
  {
    W.plug = { mesh: meshBoxes([[1060, 0, 1380, 1072, 10, 1385, SH]], 'wood'), solid: addSolid(1060, 0, 1380, 1072, 10, 1385, 'wall') };
    W.scene.add(W.plug.mesh);
  }
  // ===== PASSAGE SECRET JARDIN → MAISON (toujours ouvert) =====
  // petit trou au pied de la cabane → cagibi (fermé, la colonie reste cachée) → escalier de caisses et de pots
  // → fenêtre ouverte (150 cm) → corde à linge → vasistas de la cuisine (100 cm) → plan de travail (90 cm)
  box(1102, 1, 1385, 1105, 200, 1418, 'wood', SH, { tag: 'wall' });
  box(1105, 1, 1415, 1195, 200, 1418, 'wood', SH, { tag: 'wall' });
  deco(1106, 1, 1386, 1194, 1.2, 1414, 'wood', 0x8d6e4f);
  deco(1107, 0, 1379.6, 1121, 11, 1380, 'wood', 0x3e2b1f);   // bord sombre du trou
  box(1106, 0, 1360, 1122, 0.6, 1378, 'stone', 0x9e9e96);    // petite pierre devant le trou
  {
    // 7 marches de 18,6 cm max (caisses en bois et pots de peinture), la dernière sous la fenêtre
    const steps = [[1124, 1133, 19], [1133, 1142, 38], [1142, 1151, 56], [1151, 1160, 75], [1160, 1169, 93], [1169, 1178, 112], [1178, 1194, 131]];
    steps.forEach(([x0, x1, top], i) => {
      box(x0, 1, 1385, x1, top, 1399, i % 2 ? 'metal' : 'wood', i % 2 ? [0x1e88e5, 0xe53935, 0x43a047][i % 3] : 0xb0895c);
      deco(x0 - 0.1, top - 3, 1384.9, x1 + 0.1, top - 2, 1399.1, i % 2 ? 'metal' : 'wood', i % 2 ? 0xeeeeee : 0x7a5a3a);
    });
    glow(1186, 172, 1386, 1189, 175, 1389, 0xffd27f);   // petite lanterne près de la fenêtre
  }
  // fenêtre ouverte : volets rabattus contre la façade
  deco(1158, 150, 1378.5, 1172, 182, 1380, 'wood', 0x2e7d5b); deco(1194, 150, 1378.5, 1200, 182, 1380, 'wood', 0x2e7d5b);
  box(1172, 148, 1372, 1194, 150, 1380, 'wood', 0x8d6e4f);  // petite planche sous la fenêtre
  // corde à linge tendue de la fenêtre de la cabane (150 cm) au vasistas de la cuisine (100 cm)
  const WIRE = { axis: 'z', a0: 1372, a1: 862, h0: 150, h1: 100, w0: 1182.5, w1: 1187.5, kind: 'wire' };
  RAMPS.push(WIRE); W.wire = WIRE;
  {
    const len = Math.hypot(WIRE.a0 - WIRE.a1, WIRE.h0 - WIRE.h1), ang = Math.atan2(WIRE.h0 - WIRE.h1, WIRE.a0 - WIRE.a1);
    const rope = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, len), new THREE.MeshLambertMaterial({ color: 0xece3cc }));
    rope.rotation.x = -ang; rope.position.set(1185, (WIRE.h0 + WIRE.h1) / 2 - 0.6, (WIRE.a0 + WIRE.a1) / 2);
    W.scene.add(rope);
    // linge suspendu sous la corde (décor)
    const hang = [[1300, 0xe53935, 10], [1250, 0xfdd835, 7], [1180, 0x1e88e5, 12], [1100, 0xffffff, 9], [1020, 0x8e24aa, 8], [960, 0x43a047, 7]];
    for (const [z, col, h] of hang) {
      const y = WIRE.h0 + ((WIRE.h1 - WIRE.h0) * (z - WIRE.a0)) / (WIRE.a1 - WIRE.a0) - 1.2;
      deco(1181, y - h, z - 5, 1189, y, z + 5, 'fabric', col);
      deco(1184.4, y - 0.5, z - 3.5, 1185.6, y + 1.6, z - 2.5, 'wood', 0xd7b48f); deco(1184.4, y - 0.5, z + 2.5, 1185.6, y + 1.6, z + 3.5, 'wood', 0xd7b48f);
    }
  }
  // arbres hors clôture
  for (const [x, z, s] of [[-260, 1250, 1], [1460, 1150, 1.2], [600, 1840, 1.1], [150, 1800, 0.9], [1150, 1830, 1], [-250, 300, 1.1], [1450, 300, 1], [600, -280, 1.2]]) {
    deco(x - 15 * s, -3, z - 15 * s, x + 15 * s, 260 * s, z + 15 * s, 'wood', 0x5d4037);
    deco(x - 110 * s, 220 * s, z - 110 * s, x + 110 * s, 360 * s, z + 110 * s, 'leaf', 0x2e7d32);
    deco(x - 70 * s, 360 * s, z - 70 * s, x + 70 * s, 430 * s, z + 70 * s, 'leaf', 0x388e3c);
  }
  // fourmis animées
  for (let i = 0; i < 7; i++) {
    const m = meshBoxes([[-0.6, 0, -0.25, 0.6, 0.35, 0.25, 0x1a1a1a]], 'plain');
    W.scene.add(m); W.ants.push({ mesh: m, t: i / 7 });
  }
}

function onPath(x, z) {
  if (x >= 850 && x <= 1212 && z >= 862 && z <= 1000) return true;
  for (const s of PATH_STONES) if (Math.abs(x - s.x) < 18 && Math.abs(z - s.z) < 14) return true;
  return false;
}

function buildGrass() {
  const N = 6500, r = mulberry32(77);
  const geo = new THREE.BoxGeometry(0.9, 1, 0.3); geo.translate(0, 0.5, 0);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  let k = 0;
  for (let t = 0; t < N * 4 && k < N; t++) {
    const x = -95 + r() * 1390, z = 866 + r() * 780;
    if (onPath(x, z)) continue;
    if (x > 95 && x < 405 && z > 1145 && z < 1255) continue;
    if (x > 940 && x < 1210 && z > 1370 && z < 1610) continue;
    if (x > 1100 && x < 1128 && z > 1352 && z < 1372) continue;   // devant le petit trou de la cabane
    if (x > 480 && x < 730 && z > 990 && z < 1090) continue;
    if (x > 215 && x < 285 && z > 1475 && z < 1545) continue;
    const h = 6 + r() * 16 * (r() < 0.2 ? 1.6 : 1);
    e.set((r() - 0.5) * 0.4, r() * Math.PI, (r() - 0.5) * 0.4); q.setFromEuler(e);
    m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, h, 1));
    mesh.setMatrixAt(k, m4);
    col.setHSL(0.27 + r() * 0.06, 0.55, 0.32 + r() * 0.15); mesh.setColorAt(k, col);
    k++;
  }
  mesh.count = k; W.scene.add(mesh);
}

function buildRampVisuals() {
  for (const R of RAMPS) {
    if (R.kind === 'wire') continue;   // la corde à linge a son propre modèle
    const L = R.a1 - R.a0, rise = R.h1 - R.h0, len = Math.hypot(L, rise), ang = Math.atan2(rise, Math.abs(L)) * Math.sign(L);
    const w = R.w1 - R.w0, track = R.kind === 'track' || R.kind === 'launch';
    const c = R.kind === 'launch' ? 0xffc107 : track ? 0xff7a00 : 0xe3c08d;
    const parts = [[-len / 2, -0.8, -w / 2, len / 2, 0, w / 2, c]];
    if (R.kind === 'launch') for (let i = -len / 2 + 2; i < len / 2 - 1; i += 6) parts.push([i, 0, -w / 2 + 1, i + 2.5, 0.08, w / 2 - 1, 0xd32f2f]);
    if (track) parts.push([-len / 2, 0, -w / 2, len / 2, 1.4, -w / 2 + 0.8, c], [-len / 2, 0, w / 2 - 0.8, len / 2, 1.4, w / 2, c]);
    else for (let i = -len / 2 + 2; i < len / 2; i += 4) parts.push([i, 0, -w / 2, i + 0.3, 0.05, -w / 2 + 2.5, 0x333333]);
    let m;
    if (R.axis === 'x') { m = meshBoxes(parts, 'plain'); m.rotation.z = ang; m.position.set((R.a0 + R.a1) / 2, (R.h0 + R.h1) / 2, (R.w0 + R.w1) / 2); }
    else { m = meshBoxes(parts.map((p) => [p[2], p[1], p[0], p[5], p[4], p[3], p[6]]), 'plain'); m.rotation.x = -ang; m.position.set((R.w0 + R.w1) / 2, (R.h0 + R.h1) / 2, (R.a0 + R.a1) / 2); }
    W.scene.add(m);
    if (R.kind === 'track' && Math.max(R.h0, R.h1) > 15) for (const t of [0.35, 0.7]) {
      const a = lerp(R.a0, R.a1, t), h = lerp(R.h0, R.h1, t);
      deco(a - 1, 0, R.w0 + 1, a + 1, h - 1, R.w0 + 2, 'plain', 0x1565c0); deco(a - 1, 0, R.w1 - 2, a + 1, h - 1, R.w1 - 1, 'plain', 0x1565c0);
    }
  }
}

function finalizeWorld() {
  const special = { glassB: MATS.glass, waterB: MATS.water, glow: MATS.glow };
  for (const k in BUCKETS) {
    const b = BUCKETS[k]; if (!b.p.length) continue;
    const mesh = new THREE.Mesh(geoFromBucket(b), special[k] || MATS[k]);
    if (special[k] && k !== 'glow') mesh.renderOrder = 2;
    W.scene.add(mesh);
  }
  const p = [], idx = [];
  for (const [x0, z0, x1, z1, y] of DECALS) {
    const b = p.length / 3;
    p.push(x0, y, z0, x0, y, z1, x1, y, z1, x1, y, z0);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(idx);
  const sm = new THREE.Mesh(g, MATS.shadow); sm.renderOrder = 1; W.scene.add(sm);
}

function defineSpots() {
  const PI = Math.PI;
  Object.assign(W.spots, {
    marc_bed: { ax: 335, az: 165, pose: 'sleep', x: 255, y: 68, z: 220 },
    lea_bed: { ax: 150, az: 300, pose: 'sleep', x: 65, y: 48, z: 392 },
    marc_desk: { ax: 905, az: 210, pose: 'sit', x: 905, y: 50, z: 145, ry: PI },
    marc_tv: { ax: 300, az: 718, pose: 'sit', x: 300, y: 42, z: 800, ry: PI },
    marc_breakfast: { ax: 865, az: 520, pose: 'sit', x: 865, y: 45, z: 572, ry: 0 },
    lea_breakfast: { ax: 722, az: 650, pose: 'sit', x: 772, y: 45, z: 650, ry: PI / 2 },
    marc_cook: { ax: 1100, az: 650, pose: 'stand', ry: PI / 2 },
    marc_cook2: { ax: 1100, az: 760, pose: 'stand', ry: PI / 2 },
    marc_fridge: { ax: 1095, az: 525, pose: 'stand', ry: PI / 2 },
    marc_sdb: { ax: 612, az: 205, pose: 'stand', ry: PI / 2 },
    lea_bath: { ax: 570, az: 125, pose: 'sit', x: 560, y: 40, z: 42, ry: PI / 2 },
    marc_garden1: { ax: 250, az: 1120, pose: 'crouch', ry: 0 },
    marc_garden2: { ax: 340, az: 1122, pose: 'crouch', ry: 0 },
    marc_garden3: { ax: 470, az: 1335, pose: 'stand', ry: 0 },
    lea_rug1: { ax: 240, az: 560, pose: 'floor', ry: 0.5 },
    lea_lego: { ax: 304, az: 262, pose: 'floor', ry: 0 },
    lea_rug2: { ax: 390, az: 590, pose: 'floor', ry: -1 },
    lea_rug3: { ax: 330, az: 520, pose: 'stand', ry: 2 },
    lea_garden1: { ax: 200, az: 980, pose: 'stand', ry: 1 },
    lea_garden2: { ax: 600, az: 1250, pose: 'floor', ry: 3 },
    lea_garden3: { ax: 850, az: 1150, pose: 'stand', ry: 0 },
    front_door: { ax: 50, az: 605, pose: 'stand', ry: -PI / 2 },
  });
  W.dogSpots = [
    { x: 720, z: 800 }, { x: 900, z: 520 }, { x: 1000, z: 760 }, { x: 400, z: 640 }, { x: 560, z: 760 },
    { x: 120, z: 480 }, { x: 260, z: 300 }, { x: 560, z: 250 }, { x: 900, z: 280 }, { x: 1080, z: 380 }, { x: 760, z: 470 },
  ];
  W.zones.salonRug = { x0: 150, x1: 420, z0: 520, z1: 740 };
  W.zones.sill = { x0: 145, x1: 455, z0: 838, z1: 866, y0: 85, y1: 100 };
}

function buildWorld(scene) {
  W.scene = scene;
  buildMaterials();
  buildHouse();
  buildNorthRooms();
  buildSouthRooms();
  buildGarden();
  buildRampVisuals();
  buildEggs();
  buildBurrow();
  buildLegoCastle();
  buildBarbecue();
  defineSpots();
  finalizeWorld();
  buildGrass();
}
