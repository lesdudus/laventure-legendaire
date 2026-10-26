// ------------------------------ MONDE : PIÈCES, COQUE DE LA MAISON ------------------------------
const W = {
  scene: null, spots: {}, lamps: [], zones: {}, door: null, pane: null, tv: null, plug: null,
  puddles: [], fishBounds: null, catSpots: [], dogSpots: [], ants: [],
};
const ROOMS = [
  { id: 'chambre', name: 'Chambre', x0: 0, z0: 0, x1: 414, z1: 414 },
  { id: 'sdb', name: 'Salle de bain', x0: 426, z0: 0, x1: 714, z1: 414 },
  { id: 'bureau', name: 'Bureau', x0: 726, z0: 0, x1: 1200, z1: 414 },
  { id: 'salon', name: 'Salon', x0: 0, z0: 426, x1: 644, z1: 850 },
  { id: 'cuisine', name: 'Cuisine', x0: 656, z0: 426, x1: 1200, z1: 850 },
  { id: 'jardin', name: 'Jardin', x0: -100, z0: 862, x1: 1300, z1: 1650 },
];
function roomAt(x, z) {
  for (const r of ROOMS) if (x >= r.x0 - 6 && x <= r.x1 + 6 && z >= r.z0 - 6 && z <= r.z1 + 6) return r;
  return null;
}
const inRect = (x, z, r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

function glassPane(x0, y0, z0, x1, y1, z1) {
  geoBox(bucket('glassB'), x0, y0, z0, x1, y1, z1, 0xffffff, 1, false);
  return addSolid(x0, y0, z0, x1, y1, z1, 'glass');
}
function waterQuad(x0, z0, x1, z1, y) { geoBox(bucket('waterB'), x0, y - 0.05, z0, x1, y, z1, 0xffffff, 1, false); }

function addLamp(id, room, x, y, z, radius, shade) {
  const light = new THREE.PointLight(0xffd59a, 0, radius, 0);
  light.position.set(x, y, z); W.scene.add(light);
  const mat = new THREE.MeshBasicMaterial({ color: 0x9a8d74 });
  const b = newBucket(); geoBox(b, shade[0], shade[1], shade[2], shade[3], shade[4], shade[5], 0xffffff, 1, false);
  const mesh = new THREE.Mesh(geoFromBucket(b), mat); W.scene.add(mesh);
  W.lamps.push({ id, room, x, y, z, radius, light, mat, on: false, level: 0 });
}

function windowFrame(axis, f, a, b, y0, y1) {
  const T = 0xf4f2ec, t = 3;
  if (axis === 'x') {
    deco(a, y0, f - 1, a + t, y1, f + 1, 'plain', T); deco(b - t, y0, f - 1, b, y1, f + 1, 'plain', T);
    deco(a, y1 - t, f - 1, b, y1, f + 1, 'plain', T); deco(a, y0, f - 1, b, y0 + t, f + 1, 'plain', T);
    deco((a + b) / 2 - 1.5, y0, f - 1, (a + b) / 2 + 1.5, y1, f + 1, 'plain', T);
  } else {
    deco(f - 1, y0, a, f + 1, y1, a + t, 'plain', T); deco(f - 1, y0, b - t, f + 1, y1, b, 'plain', T);
    deco(f - 1, y1 - t, a, f + 1, y1, b, 'plain', T); deco(f - 1, y0, a, f + 1, y0 + t, b, 'plain', T);
    deco(f - 1, y0, (a + b) / 2 - 1.5, f + 1, y1, (a + b) / 2 + 1.5, 'plain', T);
  }
}

function buildHouse() {
  const C = { wall: 0xe9e1d3, ceil: 0xf3f0e8, par: 0xb07a4a, tileB: 0xd7e6ee, tileK: 0xd8c8ad, roof: 0x6d5f57, sill: 0xf4f2ec, plinth: 0xf1ede4 };
  // sols
  box(-600, -7, -600, 1800, -5, 2100, 'grass', 0x5f9a45, { solid: false });
  box(-12, -3, -12, 1212, 0, 862, 'parquet', C.par, { tag: 'floor' });
  box(426, 0, 0, 714, 0.3, 414, 'tile', C.tileB, { tag: 'floor' });
  box(656, 0, 426, 1200, 0.3, 850, 'tile', C.tileK, { tag: 'floor' });
  // murs extérieurs (avec fenêtres et portes)
  wall('x', -12, 0, -12, 1212, [{ a: 120, b: 280, y0: 90, y1: 200 }, { a: 530, b: 610, y0: 150, y1: 200 }, { a: 880, b: 893, y0: 0, y1: 12 }, { a: 1010, b: 1150, y0: 90, y1: 200 }], C.wall);
  wall('x', 850, 862, -12, 1212, [{ a: 150, b: 450, y0: 90, y1: 210 }, { a: 740, b: 880, y0: 100, y1: 200 }, { a: 1000, b: 1090, y0: 0, y1: 210 }], C.wall);
  wall('z', -12, 0, 0, 850, [{ a: 150, b: 300, y0: 90, y1: 200 }, { a: 560, b: 650, y0: 0, y1: 210 }], C.wall);
  wall('z', 1200, 1212, 0, 850, [{ a: 500, b: 650, y0: 100, y1: 200 }], C.wall);
  // murs intérieurs : portes + trous dans les plinthes (11 × 9 cm)
  wall('x', 414, 426, 0, 1200, [{ a: 150, b: 240, y0: 0, y1: 210 }, { a: 520, b: 600, y0: 0, y1: 210 }, { a: 900, b: 990, y0: 0, y1: 210 }], C.wall);
  wall('z', 414, 426, 0, 414, [{ a: 100, b: 111, y0: 0, y1: 9 }], C.wall);
  wall('z', 714, 726, 0, 414, [{ a: 300, b: 311, y0: 0, y1: 9 }], C.wall);
  wall('z', 644, 656, 426, 850, [{ a: 520, b: 700, y0: 0, y1: 210 }, { a: 790, b: 801, y0: 0, y1: 9 }], C.wall);
  // plafond + toit
  box(-12, 250, -12, 1212, 256, 862, 'plaster', C.ceil, { solid: false });
  box(-30, 256, -30, 1230, 266, 880, 'stone', C.roof, { solid: false });
  box(120, 266, 120, 1080, 300, 740, 'stone', 0x5b4f48, { solid: false });
  // plinthes (décor) avec trous visibles
  const pl = (x0, z0, x1, z1) => deco(x0, 0, z0, x1, 8, z1, 'wood', C.plinth);
  pl(0, 0, 414, 1); pl(0, 413, 150, 414); pl(240, 413, 414, 414); pl(0, 0, 1, 414); pl(413, 0, 414, 100); pl(413, 111, 414, 413);
  pl(426, 0, 714, 1); pl(426, 413, 520, 414); pl(600, 413, 714, 414); pl(426, 0, 427, 100); pl(426, 111, 427, 413); pl(713, 0, 714, 300); pl(713, 311, 714, 413);
  pl(726, 0, 880, 1); pl(893, 0, 1200, 1); pl(726, 413, 900, 414); pl(990, 413, 1200, 414); pl(726, 0, 727, 300); pl(726, 311, 727, 413); pl(1199, 0, 1200, 414);
  pl(0, 426, 150, 427); pl(240, 426, 520, 427); pl(600, 426, 644, 427); pl(0, 426, 1, 560); pl(0, 650, 1, 850); pl(643, 426, 644, 520); pl(643, 700, 644, 790); pl(643, 801, 644, 850);
  pl(656, 426, 900, 427); pl(990, 426, 1200, 427); pl(656, 426, 657, 520); pl(656, 700, 657, 790); pl(656, 801, 657, 850);
  // cadres sombres des trous de plinthe (posés DANS l'ouverture pour éviter le scintillement)
  for (const [z0, z1] of [[100, 111], [300, 311]]) {
    const x0 = z0 === 100 ? 413.4 : 713.4;
    deco(x0, 0, z0, x0 + 13.2, 9.6, z0 + 0.7, 'wood', 0x4a3a2c); deco(x0, 0, z1 - 0.7, x0 + 13.2, 9.6, z1, 'wood', 0x4a3a2c);
    deco(x0, 8.9, z0, x0 + 13.2, 9, z1, 'wood', 0x3a2c20);
  }
  deco(643.4, 0, 790, 656.6, 9.6, 790.7, 'wood', 0x4a3a2c); deco(643.4, 0, 800.3, 656.6, 9.6, 801, 'wood', 0x4a3a2c); deco(643.4, 8.9, 790, 656.6, 9, 801, 'wood', 0x3a2c20);

  // fenêtres : vitres solides, cadres, rebords
  const S = C.sill;
  glassPane(120, 90, -7, 280, 200, -5); windowFrame('x', -6, 120, 280, 90, 200); box(115, 86, 0, 285, 90, 10, 'plain', S);
  glassPane(530, 150, -7, 610, 200, -5); windowFrame('x', -6, 530, 610, 150, 200); box(527, 147, 0, 613, 150, 6, 'plain', S);
  glassPane(1010, 90, -7, 1150, 200, -5); windowFrame('x', -6, 1010, 1150, 90, 200); box(1005, 86, 0, 1155, 90, 10, 'plain', S);
  glassPane(740, 100, 855, 880, 200, 857); windowFrame('x', 856, 740, 880, 100, 200); box(735, 96, 840, 885, 100, 850, 'plain', S);
  glassPane(-7, 90, 150, -5, 200, 300); windowFrame('z', -6, 150, 300, 90, 200); box(0, 86, 145, 10, 90, 305, 'plain', S);
  glassPane(1205, 100, 500, 1207, 200, 650); windowFrame('z', 1206, 500, 650, 100, 200); box(1190, 96, 500, 1200, 100, 650, 'plain', S);
  // grande fenêtre du salon (partie droite coulissante, ouverte en journée)
  glassPane(150, 90, 855, 300, 210, 857);
  deco(147, 90, 854, 150, 210, 858, 'plain', S); deco(450, 90, 854, 453, 210, 858, 'plain', S); deco(147, 207, 854, 453, 210, 858, 'plain', S);
  box(145, 86, 840, 455, 90, 850, 'plain', S, { tag: 'sill' });
  box(145, 86, 862, 455, 90, 868, 'plain', S);
  {
    const b = newBucket(); geoBox(b, 300, 90, 855, 450, 210, 857, 0xffffff, 1, false);
    const mesh = new THREE.Mesh(geoFromBucket(b), MATS.glass); W.scene.add(mesh);
    const fr = meshBoxes([[300, 90, 854.5, 303, 210, 857.5, S], [447, 90, 854.5, 450, 210, 857.5, S], [300, 207, 854.5, 450, 210, 857.5, S], [300, 90, 854.5, 450, 93, 857.5, S]], 'plain');
    W.scene.add(fr);
    W.pane = { mesh, fr, solid: addSolid(300, 90, 855, 450, 210, 857, 'glass'), open: false };
  }

  // porte d'entrée (salon, mur ouest) — fermée
  box(-9, 0, 560, -3, 208, 650, 'wood', 0x6b4226, { tag: 'wall' });
  deco(-3, 98, 632, -1, 104, 640, 'metal', 0xd4af37);
  box(0, 0, 565, 45, 0.8, 645, 'carpet', 0x7b5e3b);
  // encadrements des portes intérieures
  for (const [a, b] of [[150, 240], [520, 600], [900, 990]]) {
    deco(a - 4, 0, 412, a, 214, 428, 'wood', C.plinth); deco(b, 0, 412, b + 4, 214, 428, 'wood', C.plinth); deco(a - 4, 210, 412, b + 4, 214, 428, 'wood', C.plinth);
  }
  deco(642, 0, 516, 658, 214, 520, 'wood', C.plinth); deco(642, 0, 700, 658, 214, 704, 'wood', C.plinth); deco(642, 210, 516, 658, 214, 704, 'wood', C.plinth);

  // porte du jardin (cuisine) avec chatière — dynamique
  {
    const dg = new THREE.Group(); dg.position.set(1000, 0, 854);
    const pc = 0x7a5233;
    dg.add(meshBoxes([[0, 0, -2, 33, 208, 2, pc], [57, 0, -2, 90, 208, 2, pc], [33, 27, -2, 57, 208, 2, pc], [33, 0, -2, 57, 2, 2, pc],
      [31, 0, -2.5, 33, 29, 2.5, 0xcfd8dc], [57, 0, -2.5, 59, 29, 2.5, 0xcfd8dc], [31, 27, -2.5, 59, 29, 2.5, 0xcfd8dc],
      [78, 95, 2, 86, 103, 6, 0xd4af37], [78, 95, -6, 86, 103, -2, 0xd4af37], [6, 120, -2.3, 84, 200, 2.3, 0x8a6040]], 'wood'));
    const fp = new THREE.Group(); fp.position.set(45, 27, 0);
    fp.add(meshBoxes([[-12, -25, -0.8, 12, 0, 0.8, 0xb0bec5], [-3, -14, -1.2, 3, -10, 1.2, 0xe53935]], 'plain'));
    dg.add(fp); W.scene.add(dg);
    W.door = {
      group: dg, open: 0, target: 0, flapPivot: fp, flapAng: 0, timer: 0,
      solids: [addSolid(1000, 0, 852, 1033, 208, 856, 'door'), addSolid(1057, 0, 852, 1090, 208, 856, 'door'), addSolid(1033, 27, 852, 1057, 208, 856, 'door'), addSolid(1033, 0, 852, 1057, 2, 856, 'door')],
      flapSolid: addSolid(1033, 2, 852.5, 1057, 27, 855.5, 'flap'),
    };
    box(1005, 0, 815, 1085, 0.8, 848, 'carpet', 0x6d4c41);
  }

  // lampes (éclairage nocturne)
  addLamp('chambre', 'chambre', 325, 86, 47, 460, [313, 76, 35, 337, 92, 59]);
  addLamp('salon', 'salon', 610, 150, 810, 620, [595, 140, 795, 625, 165, 825]);
  addLamp('cuisine', 'cuisine', 870, 186, 650, 620, [850, 190, 630, 890, 205, 670]);
  addLamp('bureau', 'bureau', 965, 98, 58, 450, [955, 100, 44, 975, 106, 64]);
  addLamp('sdb', 'sdb', 570, 236, 200, 420, [555, 240, 185, 585, 250, 215]);
  addLamp('jardin', 'jardin', 1045, 212, 880, 560, [1035, 205, 862, 1055, 225, 870]);
  deco(868, 205, 648, 872, 250, 652, 'metal', 0x333333);
}
