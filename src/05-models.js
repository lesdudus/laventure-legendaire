// ------------------------------ MODÈLES 3D (cubiques) ------------------------------
const piv = (x, y, z, ...kids) => { const g = new THREE.Group(); g.position.set(x, y, z); for (const k of kids) g.add(k); return g; };
const part = (list, m = 'plain') => meshBoxes(list, m);

function makePlayerModel(cols = {}) {
  const C = { skin: 0xf1c27d, hood: 0xd84315, pants: 0x37474f, cap: 0xb11f4b, shoe: 0x222222, ...cols };
  const root = new THREE.Group();
  const legL = piv(-0.45, 2.2, 0, part([[-0.4, -2.2, -0.4, 0.4, 0, 0.4, C.pants], [-0.42, -2.2, -0.45, 0.42, -1.85, 0.6, C.shoe]]));
  const legR = piv(0.45, 2.2, 0, part([[-0.4, -2.2, -0.4, 0.4, 0, 0.4, C.pants], [-0.42, -2.2, -0.45, 0.42, -1.85, 0.6, C.shoe]]));
  const up = piv(0, 2.2, 0);
  up.add(part([[-1, 0, -0.5, 1, 1.75, 0.5, C.hood], [-0.6, 1.3, 0.48, 0.6, 1.5, 0.55, 0xffffff]]));
  up.add(part([[-0.6, 1.75, -0.55, 0.6, 2.85, 0.55, C.skin], [-0.4, 2.3, 0.55, -0.15, 2.5, 0.6, 0x222222], [0.15, 2.3, 0.55, 0.4, 2.5, 0.6, 0x222222],
    [-0.66, 2.6, -0.62, 0.66, 2.95, 0.62, C.cap], [-0.5, 2.6, 0.6, 0.5, 2.7, 1.1, C.cap]]));
  const armL = piv(-1.25, 1.65, 0, part([[-0.28, -1.6, -0.3, 0.28, 0, 0.3, C.hood], [-0.28, -1.6, -0.3, 0.28, -1.3, 0.3, C.skin]]));
  const armR = piv(1.25, 1.65, 0, part([[-0.28, -1.6, -0.3, 0.28, 0, 0.3, C.hood], [-0.28, -1.6, -0.3, 0.28, -1.3, 0.3, C.skin]]));
  up.add(armL, armR);
  const armor = part([[-1.1, 0.2, -0.6, 1.1, 1.6, 0.62, 0x9aa3a8], [-1.12, 0.7, 0.6, 1.12, 1.1, 0.66, 0xc62828], [-1.55, 1.3, -0.45, -0.95, 1.85, 0.45, 0xb0b6bb], [0.95, 1.3, -0.45, 1.55, 1.85, 0.45, 0xb0b6bb], [-0.7, 2.95, -0.7, 0.7, 3.1, 0.7, 0x9aa3a8]], 'metal');
  armor.visible = false; up.add(armor);
  root.add(legL, legR, up);
  root.userData = { legL, legR, armL, armR, up, armor, phase: 0 };
  return root;
}
function animBiped(m, speed, dt, k = 0.35) {
  const u = m.userData;
  u.phase += speed * dt * k;
  const a = speed > 0.5 ? Math.sin(u.phase) * 0.7 : 0;
  u.legL.rotation.x = lerp(u.legL.rotation.x, a, 0.3); u.legR.rotation.x = lerp(u.legR.rotation.x, -a, 0.3);
  u.armL.rotation.x = lerp(u.armL.rotation.x, -a * 0.8, 0.3); u.armR.rotation.x = lerp(u.armR.rotation.x, a * 0.8, 0.3);
}

function makeHumanModel(o) {
  const s = o.scale, L = 85 * s;
  const root = new THREE.Group();
  const leg = () => part([[-8 * s, -L, -9 * s, 8 * s, 0, 9 * s, o.pants], [-9 * s, -L, -10 * s, 9 * s, -L + 8 * s, 16 * s, o.shoes]]);
  const legL = piv(-10 * s, L, 0, leg()), legR = piv(10 * s, L, 0, leg());
  const up = piv(0, L, 0);
  up.add(part([[-22 * s, 0, -11 * s, 22 * s, 60 * s, 11 * s, o.shirt], [-22 * s, 0, -11.2 * s, 22 * s, 6 * s, 11.2 * s, o.belt || 0x3e2723]]));
  const hd = [[-13 * s, 61 * s, -13 * s, 13 * s, 90 * s, 13 * s, o.skin], [-14 * s, 84 * s, -14 * s, 14 * s, 93 * s, 14 * s, o.hair], [-14 * s, 64 * s, -14 * s, 14 * s, 90 * s, -10 * s, o.hair],
    [-8 * s, 75 * s, 13 * s, -3 * s, 79 * s, 13.6 * s, 0x2b2b2b], [3 * s, 75 * s, 13 * s, 8 * s, 79 * s, 13.6 * s, 0x2b2b2b], [-4 * s, 67 * s, 13 * s, 4 * s, 69 * s, 13.6 * s, 0xa0522d]];
  if (o.pigtails) hd.push([-18 * s, 70 * s, -6 * s, -13 * s, 82 * s, 2 * s, o.hair], [13 * s, 70 * s, -6 * s, 18 * s, 82 * s, 2 * s, o.hair]);
  up.add(part(hd));
  const arm = () => part([[-6.5 * s, -62 * s, -6.5 * s, 6.5 * s, 0, 6.5 * s, o.shirt], [-6.5 * s, -62 * s, -6.5 * s, 6.5 * s, -48 * s, 6.5 * s, o.skin]]);
  const armL = piv(-28.5 * s, 58 * s, 0, arm()), armR = piv(28.5 * s, 58 * s, 0, arm());
  up.add(armL, armR);
  const mark = textSprite('?', '#f59e0b'); mark.position.set(0, 112 * s, 0); mark.scale.set(30, 30, 1); mark.visible = false;
  root.add(legL, legR, up, mark);
  root.userData = { legL, legR, armL, armR, up, phase: 0, L, mark, markTxt: '?' };
  return root;
}

function makeDogModel() {
  const B = 0x9c6b3c, D = 0x6d4521, W2 = 0xf5e6d0;
  const root = new THREE.Group();
  root.add(part([[-12, 26, -27, 12, 50, 28, B], [-10, 28, 20, 10, 48, 28.5, W2], [-12.5, 46, 22, 12.5, 49, 26, 0xc62828]]));
  const legs = [];
  for (const [x, z] of [[-8, 20], [8, 20], [-8, -20], [8, -20]]) { const l = piv(x, 28, z, part([[-3.5, -28, -3.5, 3.5, 0, 3.5, B], [-3.8, -28, -3.8, 3.8, -24, 5, W2]])); legs.push(l); root.add(l); }
  const head = piv(0, 46, 26, part([[-10, -4, 0, 10, 16, 20, B], [-6, -2, 20, 6, 7, 32, W2], [-2, 3, 31.5, 2, 6, 33, 0x111111],
    [-7, 7, 19.5, -3, 10, 20.2, 0x111111], [3, 7, 19.5, 7, 10, 20.2, 0x111111], [-13, 2, 4, -10, 15, 10, D], [10, 2, 4, 13, 15, 10, D], [-5, -4, 21, 5, -2, 30, 0xd88c8c]]));
  const tail = piv(0, 46, -27, part([[-2, -2, -16, 2, 2, 0, B]]));
  tail.rotation.x = -0.6;
  const mark = textSprite('!', '#dc2626'); mark.position.set(0, 80, 20); mark.scale.set(22, 22, 1); mark.visible = false;
  root.add(head, tail, mark);
  root.userData = { legs, head, tail, phase: 0, mark };
  return root;
}
function makeCatModel() {
  const O = 0xe8933a, S = 0xc56a1f, Wt = 0xfff3e0;
  const root = new THREE.Group();
  root.add(part([[-6.5, 10, -16, 6.5, 22, 16, O], [-6.6, 18, -10, 6.6, 22.2, -7, S], [-6.6, 18, -2, 6.6, 22.2, 1, S], [-6.6, 18, 6, 6.6, 22.2, 9, S], [-5, 10, 10, 5, 16, 16.2, Wt]]));
  const legs = [];
  for (const [x, z] of [[-4, 12], [4, 12], [-4, -12], [4, -12]]) { const l = piv(x, 11, z, part([[-2, -11, -2, 2, 0, 2, O], [-2.1, -11, -2.1, 2.1, -8, 2.4, Wt]])); legs.push(l); root.add(l); }
  const head = piv(0, 19, 14, part([[-6, 0, 0, 6, 11, 10, O], [-3, 1, 9.5, 3, 5, 12, Wt], [-1, 4, 11.8, 1, 5.5, 12.4, 0xf48fb1],
    [-4.5, 6, 9.8, -1.8, 8.3, 10.3, 0x2e7d32], [1.8, 6, 9.8, 4.5, 8.3, 10.3, 0x2e7d32], [-6, 11, 3, -2.5, 15, 6, O], [2.5, 11, 3, 6, 15, 6, O]]));
  const tail = piv(0, 20, -16, part([[-1.5, -1.5, -18, 1.5, 1.5, 0, O], [-1.6, -1.6, -18, 1.6, 1.6, -14, S]]));
  tail.rotation.x = -0.9;
  root.add(head, tail);
  root.userData = { legs, head, tail, phase: 0 };
  return root;
}
function animQuad(m, speed, dt, k = 0.18) {
  const u = m.userData; u.phase += speed * dt * k;
  const a = speed > 0.5 ? Math.sin(u.phase) * 0.6 : 0;
  u.legs.forEach((l, i) => { l.rotation.x = lerp(l.rotation.x, (i === 0 || i === 3 ? a : -a), 0.3); });
}
function makeFishModel() {
  const g = new THREE.Group();
  g.add(part([[-1.2, -2, -3.5, 1.2, 2, 3.5, 0xff7f27], [-0.3, -2.5, -6.5, 0.3, 2.5, -3.5, 0xffa040], [-0.2, 2, -1.5, 0.2, 3.2, 1.5, 0xffa040],
    [-1.25, 0.5, 2, -1.2, 1.2, 2.7, 0x111111], [1.2, 0.5, 2, 1.25, 1.2, 2.7, 0x111111]]));
  return g;
}

// Voiture : break de stock-car inspiré de la « Cruise Bruiser » (sans marque)
function makeWheel(r, w, front) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14), new THREE.MeshLambertMaterial({ color: 0x1b1b1b, flatShading: true }));
  tire.rotation.z = Math.PI / 2; g.add(tire);
  const chrome = new THREE.MeshLambertMaterial({ color: 0xd6dadf, emissive: 0x222222 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.1, 10), chrome); rim.rotation.z = Math.PI / 2; g.add(rim);
  const side = front ? 1 : 1;
  for (let i = 0; i < 5; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.12, r * 1.15, 0.28), new THREE.MeshLambertMaterial({ color: 0x9ea4aa }));
    sp.position.x = side * (w / 2 + 0.06); sp.rotation.x = (i / 5) * Math.PI * 2; g.add(sp);
  }
  return g;
}
function makeCarModel() {
  const root = new THREE.Group();
  const body = new THREE.Group(); body.rotation.x = 0.05; root.add(body);
  const OR = 0xf47a1f, DK = 0x1d3557, CH = 0xc8ccd0, BK = 0x1e1e1e;
  body.add(part([
    [-2.6, 0.9, -5.6, 2.6, 2.4, 5.6, OR], [-2.62, 1.55, -5.2, 2.62, 1.95, 5.2, DK],
    [-2.5, 2.4, 1.0, 2.5, 2.7, 5.6, OR], [-2.55, 2.4, -5.6, 2.55, 2.6, -5.0, OR],
    [-2.35, 2.4, 0.9, -2.05, 4.6, 1.2, OR], [2.05, 2.4, 0.9, 2.35, 4.6, 1.2, OR],
    [-2.35, 2.4, -1.4, -2.1, 4.6, -1.15, OR], [2.1, 2.4, -1.4, 2.35, 4.6, -1.15, OR],
    [-2.35, 2.4, -3.6, -2.1, 4.6, -3.35, OR], [2.1, 2.4, -3.6, 2.35, 4.6, -3.35, OR],
    [-2.35, 2.4, -5.6, -2.05, 4.6, -5.3, OR], [2.05, 2.4, -5.6, 2.35, 4.6, -5.3, OR],
    [-2.4, 4.6, -5.6, 2.4, 4.95, 1.2, OR], [-2.45, 4.95, -5.0, 2.45, 5.05, 0.6, 0x8d99ae],
    [-2.9, 0.75, 5.6, 2.9, 1.75, 6.35, CH], [-2.9, 0.95, -6.35, 2.9, 1.95, -5.6, CH],
    [-2.2, 1.35, 5.55, 2.2, 2.3, 5.68, BK], [-2.1, 1.85, 5.6, -1.4, 2.25, 5.75, 0xfff4c2], [1.4, 1.85, 5.6, 2.1, 2.25, 5.75, 0xfff4c2],
    [-2.3, 1.9, -5.68, -1.6, 2.3, -5.6, 0xd32f2f], [1.6, 1.9, -5.68, 2.3, 2.3, -5.6, 0xd32f2f],
    [-1.3, 2.7, 2.2, 1.3, 3.6, 4.6, CH], [-0.9, 3.6, 2.6, 0.9, 4.4, 4.2, CH], [-1.0, 4.4, 3.0, 1.0, 5.2, 4.0, BK], [-1.1, 5.2, 2.9, 1.1, 5.35, 4.1, CH],
    [-1.6, 3.0, 2.4, -1.3, 3.3, 4.4, CH], [1.3, 3.0, 2.4, 1.6, 3.3, 4.4, CH],
    [-2.95, 1.35, 1.4, -2.6, 1.85, 4.6, CH], [2.6, 1.35, 1.4, 2.95, 1.85, 4.6, CH],
    [-0.15, 1.9, -5.78, 0.15, 3.3, -5.62, BK], [-0.8, 2.9, -5.78, 0.8, 3.1, -5.62, BK], [-0.95, 1.9, -5.78, -0.7, 2.4, -5.62, BK], [0.7, 1.9, -5.78, 0.95, 2.4, -5.62, BK],
    [-1.7, 1.1, -2.4, 1.7, 1.4, 0.6, 0x4e342e], [-1.6, 1.4, -1.4, 1.6, 2.6, -0.9, 0x5d4037],
  ]));
  const wheels = [];
  for (const [x, z, r, w, f] of [[-2.55, 3.9, 1.05, 0.9, true], [2.55, 3.9, 1.05, 0.9, true], [-2.6, -3.8, 1.45, 1.3, false], [2.6, -3.8, 1.45, 1.3, false]]) {
    const wg = makeWheel(r, w, f); wg.position.set(x, r, z); root.add(wg); wheels.push(wg);
  }
  const seat = new THREE.Group(); seat.position.set(0, 1.25, -1.6); body.add(seat);
  const wings = part([[-6.5, 2.2, -2.5, -2.6, 2.5, 1.5, 0xff7a00], [2.6, 2.2, -2.5, 6.5, 2.5, 1.5, 0xff7a00], [-6.5, 2.5, -2.5, -6, 3.4, 1.5, 0x1d3557], [6, 2.5, -2.5, 6.5, 3.4, 1.5, 0x1d3557],
    [-2.6, 5.4, -6.2, 2.6, 5.7, -4.6, 0x1d3557], [-0.3, 4.9, -5.8, 0.3, 5.4, -5, 0x1e1e1e]]);
  wings.visible = false; body.add(wings);
  root.userData = { wheels, seat, body, wings };
  return root;
}

function makePlaneModel() {
  const v = [0, 0, 7, -6.5, 0.6, -7, 6.5, 0.6, -7, 0, -1.6, -7, 0, 0, -7];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex([0, 4, 1, 0, 2, 4, 0, 3, 4, 0, 4, 3]);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, flatShading: true }));
  const grp = new THREE.Group(); grp.add(m);
  const band = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.18, 4, 10), new THREE.MeshLambertMaterial({ color: 0xd35400 }));
  band.position.set(0, -0.9, -2); grp.add(band);
  return grp;
}
function makeJarModel() {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 12, 16, 1, true), new THREE.MeshLambertMaterial({ color: 0xd0f0ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.y = 6; g.add(glass);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(6.3, 6.3, 1.2, 16), new THREE.MeshLambertMaterial({ color: 0xc0392b }));
  lid.position.y = 12.6; g.add(lid);
  return g;
}
function textSprite(txt, color) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.font = 'bold 54px Segoe UI, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = '#ffffff'; g.strokeText(txt, 32, 36); g.fillStyle = color; g.fillText(txt, 32, 36);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.renderOrder = 10; s.userData.canvas = c;
  return s;
}
function setSpriteText(s, txt, color) {
  const c = s.userData.canvas, g = c.getContext('2d');
  g.clearRect(0, 0, 64, 64);
  g.font = 'bold 54px Segoe UI, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = '#ffffff'; g.strokeText(txt, 32, 36); g.fillStyle = color; g.fillText(txt, 32, 36);
  s.material.map.needsUpdate = true;
}
function makeTargetMarker() {
  const s = textSprite('◆', '#b11f4b'); s.scale.set(4, 4, 1); return s;
}
