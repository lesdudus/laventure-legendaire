// ------------------------------ ÉVÉNEMENTS DE LA MAISON : ACCIDENTS, ANNIVERSAIRE, NOËL ------------------------------
const ACCIDENTS = {
  cereales: { size: 'petit', x: 900, z: 718, r: 24, items: [['cereale', 5], ['lait', 1]], msg: '🥣 Léa a renversé son bol de céréales sous la table de la cuisine !' },
  assiette: { size: 'moyen', x: 1100, z: 650, r: 22, items: [['fromage', 1], ['pois', 2], ['riz', 2], ['miette', 2]], msg: '🍽️ CRASH ! Une assiette s’est brisée par terre dans la cuisine.' },
  vase: { size: 'gros', x: 381, z: 490, r: 18, items: [['robinet', 3], ['graine', 2], ['feuille', 1]], msg: '🏺 BOUM ! Le vase du meuble TV est tombé : eau et fleurs partout dans le salon !' },
  courses: { size: 'gros', x: 770, z: 560, r: 30, items: [['raisin', 2], ['fromage', 1], ['chips', 1], ['bonbon', 2], ['soda', 1]], msg: '🛍️ Le sac de courses s’est renversé dans l’entrée de la cuisine !' },
  jouets: { size: 'moyen', x: 300, z: 300, r: 30, items: [['cube', 3], ['balle', 1], ['bonbon', 1]], msg: '🧸 Le coffre à jouets de Léa a débordé dans la chambre !' },
};
const XMAS_LIGHTS = [0xff3b30, 0xffcc00, 0x34c759, 0x0a84ff];
let EVDECOR = null;
const isBirthday = (d = G.day) => d % 10 === 3;
const isXmasDeco = (d = G.day) => d % 10 >= 5 && d % 10 <= 7;
const isXmas = (d = G.day) => d % 10 === 7;
function eventParty(h) {
  if (!G || !G.started) return false;
  if (isBirthday() && h >= 16 && h < 19) return true;
  return isXmas() && h >= 9 && h < 11;
}

function buildEventDecor() {
  const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
  const bday = new THREE.Group(), xmas = new THREE.Group(), cake = new THREE.Group(), mini = new THREE.Group();
  // anniversaire : ballons attachés à la table basse + guirlande de fanions
  [[203, 603, 0xe53935], [317, 603, 0xfdd835], [203, 677, 0x1e88e5], [317, 677, 0x43a047], [260, 690, 0xd81b60]].forEach(([x, z, c], i) => {
    const top = 125 + i * 7, b = new THREE.Mesh(new THREE.SphereGeometry(9, 14, 10), lam(c));
    b.scale.y = 1.2; b.position.set(x, top, z); bday.add(b);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, top - 54, 4), lam(0xeeeeee));
    s.position.set(x, (top + 54) / 2 - 1, z); bday.add(s);
  });
  const flags = [], fc = [0xe53935, 0xfdd835, 0x1e88e5, 0x43a047, 0xff9800];
  for (let i = 0; i < 24; i++) { const x = 40 + i * 24; flags.push([x, 196 - Math.sin((i / 23) * Math.PI) * 18, 433, x + 10, 206 - Math.sin((i / 23) * Math.PI) * 18, 434, fc[i % 5]]); }
  bday.add(meshBoxes(flags, 'plain'));
  // gâteau sur la table basse
  const cyl = (r, h, y, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), lam(c)); m.position.y = y + h / 2; cake.add(m); };
  cyl(15, 8, 0, 0xfff3e0); cyl(15.4, 1.2, 7.6, 0xf48fb1); cyl(10, 6, 8, 0xf8bbd0); cyl(10.3, 1, 13.4, 0xffffff);
  for (const a of [0, 2.1, 4.2]) {
    const x = Math.cos(a) * 5, z = Math.sin(a) * 5;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 5, 6), lam(0x64b5f6)); c.position.set(x, 16.5, z); cake.add(c);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb300 })); f.scale.y = 1.6; f.position.set(x, 20, z); cake.add(f);
  }
  cake.position.set(232, 43, 625);
  // Noël : sapin, guirlande lumineuse, cadeaux
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(11, 9, 16, 14), lam(0xb71c1c)); pot.position.set(590, 8, 640); xmas.add(pot);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 22, 8), lam(0x6d4c41)); trunk.position.set(590, 24, 640); xmas.add(trunk);
  const lights = [], lightGeo = new THREE.SphereGeometry(1.6, 6, 5);
  [[40, 55, 30], [32, 48, 68], [23, 40, 102]].forEach(([r, h, y], k) => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), lam(0x1b5e20)); c.position.set(590, y + h / 2, 640); xmas.add(c);
    for (let i = 0; i < 12 - k * 3; i++) {
      const a = (i / (12 - k * 3)) * Math.PI * 2 + k, t = 0.35 + (i % 3) * 0.2, rr = r * (1 - t) + 0.8;
      const m = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: XMAS_LIGHTS[i % 4] }));
      m.position.set(590 + Math.cos(a) * rr, y + h * t, 640 + Math.sin(a) * rr); xmas.add(m); lights.push(m);
    }
  });
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(6), new THREE.MeshBasicMaterial({ color: 0xffd54f })); star.position.set(590, 147, 640); xmas.add(star);
  xmas.add(meshBoxes([
    [548, 0, 660, 568, 16, 678, 0xc62828], [557, 0, 659.5, 559, 16.5, 678.5, 0xffd54f], [547.5, 7, 668, 568.5, 9, 670, 0xffd54f],
    [600, 0, 672, 628, 12, 690, 0x1565c0], [612, 0, 671.5, 614, 12.5, 690.5, 0xffffff],
    [560, 0, 600, 574, 22, 614, 0x2e7d32], [566, 0, 599.5, 568, 22.5, 614.5, 0xe53935],
  ], 'plain'));
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: XMAS_LIGHTS[i % 4] }));
    m.position.set(20 + i * 24, 214 - Math.sin((i / 25) * Math.PI) * 14, 432); xmas.add(m); lights.push(m);
  }
  // minuscule cadeau pour le joueur, au pied du sapin
  mini.add(meshBoxes([[0, 0, 0, 5, 4, 5, 0xd81b60], [2, 0, -0.1, 3, 4.2, 5.1, 0xffeb3b], [-0.1, 0, 2, 5.1, 4.2, 3, 0xffeb3b]], 'plain'));
  mini.position.set(613, 0, 658);
  for (const g of [bday, xmas, cake, mini]) { g.visible = false; SCENE.add(g); }
  EVDECOR = { bday, xmas, cake, mini, lights };
}

function applyEventDecor() {
  if (!EVDECOR || !G.ev) return;
  const E = G.ev, h = G.hour;
  EVDECOR.bday.visible = isBirthday();
  EVDECOR.cake.visible = isBirthday() && !E.cake && h >= 12;
  EVDECOR.xmas.visible = isXmasDeco();
  EVDECOR.mini.visible = isXmas() && !E.gift;
  W.vase.visible = !(E.acc && E.acc.done && E.acc.kind === 'vase');
}

function startEventsForDay(announce) {
  if (!G.ev || G.ev.day !== G.day) {
    removeEventPickups();
    const kinds = Object.keys(ACCIDENTS);
    G.ev = { day: G.day, acc: { at: rand(9.5, 18.5), kind: pick(kinds), done: false }, cleanAt: 0, cake: false, gift: false, partyAnn: false, xAnn: false };
  }
  applyEventDecor();
  if (!announce) return;
  if (isBirthday()) setTimeout(() => toast('🎂 Aujourd’hui, c’est l’anniversaire de Léa ! Fête au salon de 16 h à 19 h… il restera sûrement des miettes de gâteau.', 'info'), 600);
  else if (isXmas()) setTimeout(() => toast('🎄 Joyeux Noël ! Un minuscule paquet t’attend au pied du sapin du salon.', 'success'), 600);
  else if (isXmasDeco()) setTimeout(() => toast('🎄 Marc a installé le sapin de Noël dans le salon. Noël approche !', 'info'), 600);
}
function resetEvents() { removeEventPickups(); if (EVDECOR) for (const k of ['bday', 'xmas', 'cake', 'mini']) EVDECOR[k].visible = false; if (W.vase) W.vase.visible = true; }
function removeEventPickups() { for (const p of PICKUPS.slice()) if (p.ev) removePickup(p); }

function scatter(list, cx, cz, r, y0 = null) {
  let n = 0;
  for (const [id, k] of list) for (let i = 0; i < k; i++) {
    const a = rand(0, Math.PI * 2), d = rand(r * 0.25, r), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const y = y0 ?? groundAt(x, z, 0.3, 60);
    const p = spawnPickup(id, 1, x, y, z); p.ev = true; n++;
  }
  return n;
}
function triggerAccident() {
  const E = G.ev; if (!E) return;
  const A = ACCIDENTS[E.acc.kind]; E.acc.done = true;
  scatter(A.items, A.x, A.z, A.r);
  E.cleanAt = G.time + 180;
  applyEventDecor();
  SFX.at('crash', A.x, 10, A.z, 1400, 1); G.shake = Math.max(G.shake, 0.25);
  emitNoise(A.x, 10, A.z, 900, 0.7, 'objet');
  toast(`${A.msg} (accident ${A.size}) — des choses à ramasser, mais les humains vont venir nettoyer…`, 'warn');
  Missions.event('accident');
}
function cleanupEvent() {
  const left = PICKUPS.filter((p) => p.ev).length;
  removeEventPickups(); G.ev.cleanAt = 0;
  if (left) toast('🧹 Marc a nettoyé les dégâts : ce qui traînait encore a disparu.', 'info');
}
function birthdayLeftovers() {
  G.ev.cake = true; applyEventDecor();
  const pk = spawnPickup('part_gateau', 1, 232, 43, 625); pk.ev = false;
  scatter([['miette', 3], ['bonbon', 1]], 260, 640, 70);
  G.ev.cleanAt = G.time + 300;
  SFX.play('party'); toast('🍰 La fête est finie : il reste une part de gâteau sur la table basse et des miettes partout !', 'success');
}
function eventInteracts() {
  const L = [];
  if (G.ev && isXmas() && !G.ev.gift && G.hour >= 6) L.push({ x: 615.5, y: 1, z: 660.5, r: 12, label: '🎁 Ouvrir ton minuscule cadeau', act: openXmasGift });
  return L;
}
function openXmasGift() {
  G.ev.gift = true; applyEventDecor();
  giveItem('bonbon', 3); giveItem('miel', 1); giveItem('cube', 4); giveItem('pomme_or', 1);
  SFX.play('party'); G.stars = (G.stars || 0) + 1;
  UI.dialog('🎁 Cadeau de Noël', 'Une étiquette minuscule, écrite par Léa : « Pour le petit lutin qui vit derrière le bureau. Je sais que tu existes ! » Dedans : 3 bonbons, du miel, 4 cubes et une pomme dorée. (+1 ⭐)', [{ label: 'Merci, Léa !' }]);
}
function updateEvents() {
  if (!G.started || !G.ev || !EVDECOR || G.ev.day !== G.day) return;
  const E = G.ev, h = G.hour;
  if (!E.acc.done && h >= E.acc.at && h < 20 && G.mode !== 'dead') triggerAccident();
  if (E.cleanAt && G.time >= E.cleanAt) cleanupEvent();
  if (isBirthday()) {
    if (!E.partyAnn && h >= 16 && h < 19) { E.partyAnn = true; SFX.play('party'); toast('🎉 La fête d’anniversaire commence au salon : tout le monde est occupé, profites-en !', 'info'); }
    if (!E.cake && h >= 19) birthdayLeftovers();
    EVDECOR.cake.visible = !E.cake && h >= 12;
  }
  if (isXmas() && !E.xAnn && h >= 9 && h < 11) { E.xAnn = true; SFX.play('party'); toast('🎄 Marc et Léa ouvrent leurs cadeaux au pied du sapin !', 'info'); }
  if (EVDECOR.xmas.visible) { const s = Math.floor(G.simT * 2.5); EVDECOR.lights.forEach((m, i) => m.material.color.setHex(XMAS_LIGHTS[(i + s) % 4])); }
}
