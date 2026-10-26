// ------------------------------ BARBECUE DE LA TERRASSE ------------------------------
// Chaud un jour sur deux (jours pairs) de 12 h à 22 h. On y grille le chamallow géant → Festin du barbecue.
// Accès pour un enfant : terrasse (1,2) → sac de charbon (19) → bûches (36) → tablette (54) : marches ≤ 20 cm.
const BBQ = { x: 1150, z: 935, y0: 1.2, top: 73, shelf: { x: 1183, y: 54, z: 936 }, embers: null, coals: null, light: null, smoke: [], burnT: 0 };
const bbqHot = () => !!G.started && G.day % 2 === 0 && G.hour >= 12 && G.hour < 22;

function buildBarbecue() {
  const S = W.scene, y = BBQ.y0, M = 0x2a2a2a, MD = 0x1c1c1c;
  // pieds
  for (const [x, z] of [[1131, 916], [1167, 916], [1131, 954], [1167, 954]]) box(x - 1.2, y, z - 1.2, x + 1.2, 56, z + 1.2, 'metal', MD);
  deco(1131, 18, 915.4, 1167, 20, 916.6, 'metal', MD); deco(1131, 18, 953.4, 1167, 20, 954.6, 'metal', MD);
  // cuve (pleine : on ne tombe pas dedans) et grille
  box(1128, 56, 913, 1172, 72, 957, 'metal', M, { tag: 'bbq' });
  deco(1127, 70, 912, 1173, 72, 913, 'metal', 0x3a3a3a); deco(1127, 70, 957, 1173, 72, 958, 'metal', 0x3a3a3a);
  deco(1127, 70, 913, 1128, 72, 957, 'metal', 0x3a3a3a); deco(1172, 70, 913, 1173, 72, 957, 'metal', 0x3a3a3a);
  box(1128.5, 72, 913.5, 1171.5, 72.4, 956.5, 'metal', 0x111111, { tag: 'bbq' });
  for (let x = 1130; x < 1171; x += 3) deco(x, 72.4, 913.5, x + 0.8, 73, 956.5, 'metal', 0xb0b6bb);
  // couvercle relevé à l'arrière
  deco(1128, 73, 957, 1172, 106, 960, 'metal', M); deco(1146, 104, 960, 1154, 107, 963, 'wood', 0x6d4c41);
  // braises (chaud) et charbons (froid), sous la grille
  const coals = meshBoxes([[1131, 72.4, 916, 1169, 72.45, 954, 0x333333]], 'plain'); S.add(coals);
  const em = [];
  for (let i = 0; i < 26; i++) { const x = 1132 + (i * 37) % 35, z = 917 + (i * 53) % 35; em.push([x, 72.42, z, x + 2.4, 72.5, z + 2.4, 0xffffff]); }
  const embers = meshBoxes(em, 'plain'); embers.material = new THREE.MeshBasicMaterial({ color: 0xff7a1a }); S.add(embers);
  const light = new THREE.PointLight(0xff8c3a, 0, 90, 1); light.position.set(1150, 80, 935); S.add(light);
  // fumée (quelques cubes gris qui montent)
  const smat = new THREE.MeshBasicMaterial({ color: 0xbdbdbd, transparent: true, opacity: 0.35, depthWrite: false });
  for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), smat); m.userData.t = i / 14; m.visible = false; S.add(m); BBQ.smoke.push(m); }
  // tablette latérale, bûches et sac de charbon (l'escalier du joueur)
  box(1172, 52, 925, 1194, 54, 947, 'wood', 0x8d6e4f);
  box(1192, y, 926, 1194, 52, 928, 'wood', 0x6d4c41); box(1192, y, 944, 1194, 52, 946, 'wood', 0x6d4c41);
  box(1194, y, 925, 1212, 36, 947, 'wood', 0x795548);
  for (let k = 0; k < 4; k++) deco(1194, y + 2 + k * 8.5, 924.6, 1212, y + 8 + k * 8.5, 925, 'wood', 0x5d4037);
  box(1194, y, 948, 1212, 19, 968, 'paper', 0x3e2723);
  deco(1196, 6, 967.9, 1210, 14, 968.2, 'paper', 0xf2c94c); deco(1199, 8, 968.2, 1207, 12, 968.3, 'paper', 0x111111);
  // pince et ustensiles sur la tablette
  deco(1176, 54, 930, 1190, 54.6, 931, 'metal', 0xb0b6bb); deco(1176, 54, 940, 1188, 55, 942, 'wood', 0x6d4c41);
  Object.assign(BBQ, { embers, coals, light });
  shadow(1128, 913, 1212, 968);
}

function bbqStatus() {
  if (bbqHot()) return 'Le barbecue est chaud ! Les braises rougeoient jusqu’à 22 h.';
  const even = G.day % 2 === 0;
  if (even && G.hour < 12) return 'Le barbecue chauffera cet après-midi, à partir de 12 h.';
  if (even) return 'Le barbecue est froid, reviens après-demain après midi.';
  return 'Le barbecue est froid, reviens demain après midi.';
}
function bbqInteracts() {
  const L = [];
  const hot = bbqHot(), has = INV.count('chamallow') > 0;
  L.push({ x: 1185, y: BBQ.y0, z: 945, r: 34, label: hot ? '🔥 Barbecue chaud (grimpe : sac de charbon → bûches → tablette)' : '🔥 Barbecue (froid)', act: () => toast(bbqStatus(), hot ? 'success' : 'info') });
  L.push({ ...BBQ.shelf, r: 15, label: !hot ? 'Barbecue froid' : has ? '🍥 Faire griller le chamallow géant' : '🔥 Il faudrait quelque chose à faire griller…', act: () => {
    if (!hot) return toast(bbqStatus(), 'info');
    if (!has) return toast('Le barbecue est chaud, mais tu n’as rien à faire griller.', 'info');
    const r = RECIPES.find((q) => q.out === 'festin');
    craft(r, 'bbq'); SFX.play('crunch', 0.6); emitNoise(1150, 73, 935, 120, 0.2, 'joueur');
  } });
  return L;
}
function updateBarbecue(dt) {
  if (!BBQ.embers) return;
  const hot = bbqHot(), t = G.simT;
  BBQ.embers.visible = hot; BBQ.coals.visible = !hot;
  BBQ.light.intensity = hot ? 1.1 + Math.sin(t * 9) * 0.15 + Math.sin(t * 23) * 0.1 : 0;
  if (hot) BBQ.embers.material.color.setHSL(0.06 + Math.sin(t * 5) * 0.015, 1, 0.5 + Math.sin(t * 11) * 0.06);
  for (const m of BBQ.smoke) {
    m.visible = hot;
    if (!hot) continue;
    m.userData.t = (m.userData.t + dt * 0.12) % 1;
    const k = m.userData.t;
    m.position.set(1150 + Math.sin(k * 9 + m.id) * 6, 76 + k * 90, 935 + Math.cos(k * 7 + m.id) * 5);
    m.scale.setScalar(0.6 + k * 2.2);
  }
  // brûlure si on marche sur la grille chaude
  BBQ.burnT -= dt;
  const P = G.p;
  if (hot && G.mode === 'walk' && P.onGround && P.y > 71 && P.y < 75 && P.x > 1128 && P.x < 1172 && P.z > 913 && P.z < 957 && BBQ.burnT <= 0) {
    BBQ.burnT = 1; damage(6, 'Aïe, la grille est brûlante');
    P.vx = 60; P.vy = 160; P.onGround = false; P.airTop = P.y;
  }
}
