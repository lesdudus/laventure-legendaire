// ------------------------------ CLINS D'ŒIL CUBIQUES (jouets originaux inspirés de l'univers « blocs ») ------------------------------
const EGGS = {};
const EGG_COUNT = 16;
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function buildEggs() {
  const S = W.scene;
  // 1. Brique TNT (salon, coin du tapis)
  {
    const side = canvasTex(16, 16, (g) => { g.fillStyle = '#c62828'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#9b1c1c'; for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 1, 16); g.fillStyle = '#f2f2f2'; g.fillRect(0, 5, 16, 6); g.fillStyle = '#222'; g.font = 'bold 6px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TNT', 8, 8.5); });
    const top = canvasTex(16, 16, (g) => { g.fillStyle = '#c62828'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#ddd'; g.fillRect(5, 5, 6, 6); g.fillStyle = '#555'; g.fillRect(7, 7, 2, 2); });
    const ms = [side, side, top, top, side, side].map((t) => new THREE.MeshLambertMaterial({ map: t }));
    const m = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), ms); m.position.set(385, 5.8, 705); S.add(m);
    addSolid(380, 0.8, 700, 390, 10.8, 710, 'egg');
    EGGS.tnt = { x: 385, y: 0.8, z: 705, mesh: m };
  }
  // 2. Figurine verte pixelisée qui « siffle » (bureau)
  {
    const g1 = 0x4caf50, g2 = 0x388e3c, g3 = 0x66bb6a, K = 0x111111;
    const m = meshBoxes([
      [1107, 0, 337, 1109, 4, 339, g2], [1111, 0, 337, 1113, 4, 339, g2], [1107, 0, 341, 1109, 4, 343, g2], [1111, 0, 341, 1113, 4, 343, g2],
      [1107.5, 4, 338.5, 1112.5, 13, 341.5, g1], [1108, 6, 338.4, 1110, 8, 338.6, g3], [1110.5, 9, 338.4, 1112, 11, 338.6, g2],
      [1107, 13, 337, 1113, 19, 343, g1], [1107.6, 17, 336.8, 1108.8, 18.2, 337, g3],
      [1106.8, 16, 337.8, 1107, 17.4, 339.2, K], [1106.8, 16, 340.8, 1107, 17.4, 342.2, K], [1106.8, 14, 339.4, 1107, 16, 340.6, K], [1106.8, 13.4, 338.8, 1107, 14.6, 339.4, K], [1106.8, 13.4, 340.6, 1107, 14.6, 341.2, K],
    ], 'plain');
    S.add(m); addSolid(1107, 0, 337, 1113, 19, 343, 'egg');
    EGGS.creeper = { x: 1110, y: 0, z: 340 };
  }
  // 3. Bloc d'herbe jouet (chambre)
  box(230, 0.8, 300, 240, 8.8, 310, 'dirt', 0x8b5a2b, { tag: 'egg' }); box(230, 8.8, 300, 240, 10.8, 310, 'grass', 0x5fae3e, { tag: 'egg' });
  for (const [x0, z0, x1, z1, h] of [[229.9, 302, 230, 304, 7.5], [229.9, 306, 230, 307, 6.5], [240, 301, 240.1, 303, 7], [232, 299.9, 234, 300, 7.2], [236, 310, 238, 310.1, 6.8]]) deco(x0, h, z0, x1, 8.8, z1, 'grass', 0x5fae3e);
  EGGS.grass = { x: 235, y: 0.8, z: 305 };
  // 4. Établi-jouet (salon, près de la bibliothèque)
  box(48, 0, 548, 60, 10, 560, 'wood', 0xa0703f, { tag: 'egg' }); box(47.5, 10, 547.5, 60.5, 12, 560.5, 'wood', 0xc8915a, { tag: 'egg' });
  for (const k of [51.5, 54, 56.5]) { deco(48, 12, k - 0.15, 60, 12.1, k + 0.15, 'plain', 0x5d4037); deco(k - 0.15, 12, 548, k + 0.15, 12.1, 560, 'plain', 0x5d4037); }
  deco(47.6, 3, 550, 47.8, 8, 552, 'metal', 0x9e9e9e); deco(47.6, 5, 554, 47.8, 6, 558, 'wood', 0x6d4c41);
  EGGS.craft = { x: 54, y: 0, z: 554 };
  // 5. Four-jouet (cuisine) avec bouche lumineuse
  box(1108, 0.3, 780, 1120, 12.3, 792, 'stone', 0x8a8a8a, { tag: 'egg' });
  deco(1107.8, 2.5, 783, 1108, 6.5, 789, 'plain', 0x2a2a2a);
  {
    const mat = new THREE.MeshBasicMaterial({ color: 0x3a2a1a });
    const b = newBucket(); geoBox(b, 1107.7, 3, 783.5, 1107.8, 6, 788.5, 0xffffff, 1, false);
    S.add(new THREE.Mesh(geoFromBucket(b), mat));
    EGGS.furnace = { x: 1114, y: 0.3, z: 786, mat, heat: 0 };
  }
  // 6. Gâteau cubique (table de la cuisine), mangeable par parts
  {
    const g = new THREE.Group(); g.position.set(896, 75, 645);
    g.add(meshBoxes([[0, 0, 0, 14, 3, 14, 0xd9a35b], [0, 3, 0, 14, 5, 14, 0xfafafa], [2, 5, 3, 3.5, 5.6, 4.5, 0xd32f2f], [9, 5, 2, 10.5, 5.6, 3.5, 0xd32f2f], [6, 5, 8, 7.5, 5.6, 9.5, 0xd32f2f], [11, 5, 10, 12.5, 5.6, 11.5, 0xd32f2f], [3, 5, 11, 4.5, 5.6, 12.5, 0xd32f2f]], 'plain'));
    S.add(g);
    EGGS.cake = { x: 903, y: 75, z: 652, group: g, solid: addSolid(896, 75, 645, 910, 80, 659, 'egg'), shown: 6 };
  }
  // 7. Juke-box (salon, près du meuble TV)
  box(350, 0, 476, 362, 11, 488, 'wood', 0x6d4226, { tag: 'egg' }); box(349.5, 11, 475.5, 362.5, 12, 488.5, 'wood', 0x8d5a36, { tag: 'egg' });
  deco(351, 12, 481.5, 361, 12.2, 482.5, 'plain', 0x111111);
  EGGS.jukebox = { x: 356, y: 0, z: 482 };
  // 8. Cochon en peluche (lit de Léa)
  box(52, 40, 330, 61, 46, 344, 'fabric', 0xf4a7b9, { tag: 'egg' });
  deco(52.5, 42, 344, 60.5, 47.5, 349, 'fabric', 0xf4a7b9); deco(54.5, 42.5, 349, 58.5, 45, 350, 'fabric', 0xe57f98);
  deco(54.5, 45.8, 349.2, 55.5, 46.8, 349.4, 'plain', 0x111111); deco(57.5, 45.8, 349.2, 58.5, 46.8, 349.4, 'plain', 0x111111);
  EGGS.pig = { x: 57, y: 40, z: 340 };
  // 9. Grande silhouette noire aux yeux violets (se téléporte quand on la fixe)
  {
    const B = 0x161616;
    const g = new THREE.Group();
    g.add(meshBoxes([[-1.6, 0, -0.6, -0.4, 17, 0.6, B], [0.4, 0, -0.6, 1.6, 17, 0.6, B], [-2, 17, -1, 2, 26, 1, B], [-3, 11, -0.5, -2, 26, 0.5, B], [2, 11, -0.5, 3, 26, 0.5, B], [-2, 26, -2, 2, 30, 2, B]], 'plain'));
    const eyes = meshBoxes([[-1.6, 27.6, 2, -0.4, 28.3, 2.1, 0xd05cff], [0.4, 27.6, 2, 1.6, 28.3, 2.1, 0xd05cff]], 'plain');
    eyes.material = new THREE.MeshBasicMaterial({ color: 0xd05cff }); g.add(eyes);
    S.add(g);
    EGGS.ender = { group: g, spots: [[395, 0, 238, -Math.PI / 2], [630, 0, 840, Math.PI], [1188, 0, 400, -Math.PI / 2], [705, 0.3, 300, -Math.PI / 2], [-80, 0, 1630, Math.PI * 0.75]], cool: 0 };
  }
  // 10. Torches (jardin + cabane)
  EGGS.torches = [];
  for (const [x, y, z] of [[1012, 1.5, 1002], [300, 0, 1478], [975, 1, 1405]]) {
    deco(x - 0.5, y, z - 0.5, x + 0.5, y + 8, z + 0.5, 'wood', 0x6d4c41);
    const m = meshBoxes([[x - 0.9, y + 8, z - 0.9, x + 0.9, y + 9.8, z + 0.9, 0xffffff]], 'plain'); m.material = new THREE.MeshBasicMaterial({ color: 0xffb300 }); S.add(m);
    EGGS.torches.push({ x, y, z, mesh: m });
  }
  // 11. Lit-jouet rouge (caché sous le grand lit)
  box(200, 0, 150, 216, 2, 159, 'wood', 0x8d6e4f, { tag: 'egg' }); box(200, 2, 150, 211, 4, 159, 'fabric', 0xc62828, { tag: 'egg' }); box(211, 2, 150, 216, 4, 159, 'fabric', 0xf5f5f5, { tag: 'egg' });
  EGGS.bed = { x: 208, y: 0, z: 155 };
  // 12. Panneau en bois gravé (jardin)
  {
    const t = canvasTex(64, 32, (g) => { g.fillStyle = '#b5884f'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#9c7240'; for (let y = 0; y < 32; y += 8) g.fillRect(0, y, 64, 1); g.fillStyle = '#2b1b0e'; g.font = 'bold 9px monospace'; g.textAlign = 'center'; g.fillText('BIENVENUE', 32, 13); g.fillText('À 5 CM', 32, 24); });
    deco(829.5, 0, 1009.5, 830.5, 9, 1010.5, 'wood', 0x6d4c41);
    const m = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 0.8), [0, 0, 0, 0, 0, 0].map((_, i) => new THREE.MeshLambertMaterial(i === 4 || i === 5 ? { map: t } : { color: 0x9c7240 })));
    m.position.set(830, 12, 1010); S.add(m); addSolid(823, 8.5, 1009.6, 837, 15.5, 1010.4, 'egg');
    EGGS.sign = { x: 830, y: 0, z: 1013 };
  }
  // 13. Bloc de minerai à diamants (jardin, près de la fourmilière)
  box(300, 0, 1545, 312, 12, 1557, 'stone', 0x8f8f8f, { tag: 'egg' });
  for (const [a, b, c] of [[302, 3, 1544.9], [307, 8, 1544.9], [304, 6, 1544.9], [312, 4, 1548], [312, 9, 1553], [299.9, 5, 1550], [299.9, 9, 1547]]) {
    if (c === 1544.9) deco(a, b, c, a + 2, b + 2, c + 0.1, 'plain', 0x4fe3d6);
    else if (a === 312) deco(a, b, c, a + 0.1, b + 2, c + 2, 'plain', 0x4fe3d6);
    else deco(a, b, c, a + 0.1, b + 2, c + 2, 'plain', 0x4fe3d6);
  }
  deco(303, 12, 1548, 305, 12.1, 1550, 'plain', 0x4fe3d6); deco(308, 12, 1552, 310, 12.1, 1554, 'plain', 0x4fe3d6);
  EGGS.ore = { x: 306, y: 0, z: 1551 };
}
