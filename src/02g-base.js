// ------------------------------ LA BASE : TROU DE SOURIS DERRIÈRE LE BUREAU ------------------------------
// Chambre creusée derrière le mur nord du bureau (x 840–960, z −62 à −12), entrée par un trou de souris (x 880–893).
const BASE_UPS = {
  tapis: { name: 'Tapis en feutrine', icon: '🧶', desc: 'Repos et sommeil 40 % plus efficaces dans la base.' },
  garde_manger: { name: 'Garde-manger', icon: '🥫', desc: 'Chaque matin, 2 aliments apparaissent dans le coffre de la base.' },
  recuperateur: { name: 'Récupérateur de gouttes', icon: '🚿', desc: 'Chaque matin, 2 gouttes d’eau sont déposées dans le coffre.' },
  vitrine: { name: 'Vitrine à trésors', icon: '🏆', desc: 'Les clins d’œil cubiques pas encore trouvés apparaissent sur la mini-carte.' },
  periscope: { name: 'Périscope', icon: '🔭', desc: 'Mini-carte permanente qui révèle Marc, Léa et Rex.' },
  garage: { name: 'Garage', icon: '🅿️', desc: 'Depuis la base, rappelle ta voiture devant le trou de souris.' },
};
function buildBurrow() {
  const S = W.scene, ROCK = 0x8b7355, DARK = 0x5d4a36;
  box(836, -3, -66, 964, 0, -12, 'wood', 0x9b7653, { tag: 'floor' });
  box(834, 0, -68, 840, 34, -12, 'dirt', ROCK, { tag: 'wall' }); box(960, 0, -68, 966, 34, -12, 'dirt', ROCK, { tag: 'wall' });
  box(834, 0, -68, 966, 34, -62, 'dirt', ROCK, { tag: 'wall' }); box(834, 34, -68, 966, 40, -12, 'dirt', DARK, { tag: 'wall' });
  for (const x of [850, 880, 910, 940]) deco(x, 30, -62, x + 3, 34, -12, 'wood', 0x6d4c41);
  // cadre du trou de souris côté bureau
  deco(877.5, 0, 0, 880, 13, 0.8, 'wood', 0x4e342e); deco(893, 0, 0, 895.5, 13, 0.8, 'wood', 0x4e342e); deco(877.5, 12, 0, 895.5, 14.5, 0.8, 'wood', 0x4e342e);
  deco(880, 11, 0, 882, 12, 0.6, 'wood', 0x4e342e); deco(891, 11, 0, 893, 12, 0.6, 'wood', 0x4e342e);
  // lit (éponge), coffre de 50 places, établi, atelier de couture
  box(844, 0, -58, 866, 3, -44, 'plain', 0xf2d24c, { tag: 'basebed' }); deco(844, 3, -58, 866, 4, -44, 'fabric', 0x3fa34d); deco(845, 4, -57, 851, 5.5, -45, 'fabric', 0xfafafa);
  box(932, 0, -60, 950, 10, -50, 'wood', 0x6b4226); deco(931.8, 6, -60.2, 950.2, 7, -49.8, 'metal', 0xd4af37); deco(939.5, 4, -50.3, 942.5, 7.5, -49.8, 'metal', 0xd4af37);
  box(906, 0, -60, 922, 6, -52, 'paper', 0xc0392b); deco(905.8, 2, -60.2, 922.2, 4, -51.8, 'paper', 0x2f5d8a); deco(910, 6, -58, 912, 6.4, -54, 'metal', 0x9e9e9e);
  box(872, 0, -60, 879, 7, -54, 'metal', 0xc0c4c8); deco(871.8, 1, -60.2, 879.2, 1.6, -53.8, 'metal', 0x9aa0a6);
  box(882, 0, -59, 888, 6, -55, 'wood', 0xe8d5b5); deco(881.8, 1.5, -59.2, 888.2, 4.5, -54.8, 'fabric', 0x7e57c2);
  deco(889, 0, -57, 889.3, 9, -56.7, 'metal', 0xcfd8dc);
  // torche murale façon jeu de blocs + lumière de feu
  deco(899, 14, -62, 901, 24, -60, 'wood', 0x6d4c41);
  const flame = meshBoxes([[898.6, 24, -61.6, 901.4, 27, -59.8, 0xffffff]], 'plain'); flame.material = new THREE.MeshBasicMaterial({ color: 0xffa726 }); S.add(flame);
  // lumière de feu douce : portée limitée à la base et atténuée avec la distance (sinon tout vire au rouge la nuit)
  const light = new THREE.PointLight(0xffb36b, 1.5, 85, 1); light.position.set(900, 26, -55); S.add(light);
  // améliorations (cachées tant qu'elles ne sont pas installées)
  const ups = {};
  const up = (id, boxes, solid) => {
    const m = meshBoxes(boxes, 'plain'); m.visible = false; S.add(m);
    const s = solid ? addSolid(...solid, 'egg') : null; if (s) removeSolid(s);
    ups[id] = { mesh: m, solid: s };
  };
  up('tapis', [[868, 0, -42, 932, 0.35, -20, 0xb5651d], [872, 0.35, -38, 928, 0.45, -24, 0xe9c46a], [880, 0.45, -34, 920, 0.55, -28, 0xc0392b]]);
  up('garde_manger', [[948, 0, -40, 958, 16, -26, 0x8d6e4f], [948.5, 5, -40.2, 957.5, 5.6, -25.8, 0x5d4037], [948.5, 10.5, -40.2, 957.5, 11, -25.8, 0x5d4037],
    [949.5, 5.6, -38, 951.5, 9, -36, 0xf2c94c], [952, 5.6, -35, 954, 8.5, -33, 0xd32f2f], [949.5, 11, -32, 952, 14, -29.5, 0x6abf40]], [948, 0, -40, 958, 16, -26]);
  up('recuperateur', [[843, 0, -30, 851, 2, -22, 0x1e88e5], [846.5, 2, -26.5, 847.5, 34, -25.5, 0x9aa3a8], [846, 6, -27, 848, 8, -25, 0x7ec8f0]], [843, 0, -30, 851, 2, -22]);
  up('vitrine', [[840, 8, -44, 846, 9, -20, 0x8d6e4f], [840, 17, -44, 846, 18, -20, 0x8d6e4f], [841, 9, -42, 843, 11, -40, 0x4fe3d6], [841, 9, -36, 843, 12, -34, 0xf5c518],
    [841, 9, -30, 843, 11, -28, 0xc62828], [841, 18, -42, 843, 20, -40, 0x4caf50], [841, 18, -35, 843, 21, -33, 0xf4a7b9], [841, 18, -28, 843, 20, -26, 0x6d4226]]);
  up('periscope', [[954, 0, -19, 958, 34, -15, 0x607d8b], [952, 14, -19, 954, 17, -15, 0x37474f], [951.5, 14.5, -18.5, 952, 16.5, -15.5, 0x90caf9]]);
  up('garage', [[940, 0.42, 3, 941, 0.5, 27, 0xfafafa], [962, 0.42, 3, 963, 0.5, 27, 0xfafafa], [952, 0, 3, 962, 4, 9, 0xd32f2f], [956, 0, 25, 957, 12, 26, 0x9e9e9e], [952, 9, 25.5, 961, 13, 26, 0x1565c0]]);
  W.zones.burrow = { x0: 840, x1: 960, z0: -62, z1: -12, y0: -1, y1: 34 };
  W.zones.hole = { x0: 880, x1: 893, z0: -13, z1: 1, y0: -1, y1: 13 };
  W.base = {
    spawn: { x: 900, y: 0, z: -34 }, bed: { x: 855, y: 0, z: -51 }, chest: { x: 941, y: 0, z: -55 }, bench: { x: 914, y: 0, z: -56 },
    couture: { x: 881, y: 0, z: -56 }, torch: { light, flame }, ups,
  };
}
const inBaseArea = (x, y, z) => inZone(W.zones.base, x, y, z) || inZone(W.zones.burrow, x, y, z) || inZone(W.zones.hole, x, y, z);
function refreshBase() {
  for (const id in W.base.ups) {
    const u = W.base.ups[id], on = !!(G.baseUp && G.baseUp[id]);
    u.mesh.visible = on;
    if (u.solid) { if (on && u.solid.off) { u.solid.off = false; hashOp(u.solid, true); } else if (!on && !u.solid.off) removeSolid(u.solid); }
  }
}
