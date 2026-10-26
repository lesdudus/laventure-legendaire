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
  // anniversaire : ballons attachés à la table basse + guirlande de fanions (on peut s'accrocher aux ballons)
  const balloons = [];
  [[203, 603, 0xe53935], [317, 603, 0xfdd835], [203, 677, 0x1e88e5], [317, 677, 0x43a047], [260, 690, 0xd81b60]].forEach(([x, z, c], i) => {
    const top = 125 + i * 7, b = new THREE.Mesh(new THREE.SphereGeometry(9, 14, 10), lam(c));
    b.scale.y = 1.2; b.position.set(x, top, z); bday.add(b);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, top - 54, 4), lam(0xeeeeee));
    s.position.set(x, (top + 54) / 2 - 1, z); bday.add(s);
    balloons.push({ x, z, top, c, ball: b, string: s });
  });
  const flags = [], fc = [0xe53935, 0xfdd835, 0x1e88e5, 0x43a047, 0xff9800];
  for (let i = 0; i < 24; i++) { const x = 40 + i * 24; flags.push([x, 196 - Math.sin((i / 23) * Math.PI) * 18, 433, x + 10, 206 - Math.sin((i / 23) * Math.PI) * 18, 434, fc[i % 5]]); }
  bday.add(meshBoxes(flags, 'plain'));
  // médaille d'or en chocolat suspendue à la guirlande (objet unique, accessible en ballon)
  const medal = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.4, 16), new THREE.MeshLambertMaterial({ color: 0xf5c518, emissive: 0x5a4300 }));
  disc.rotation.x = Math.PI / 2; medal.add(disc);
  medal.add(meshBoxes([[-0.5, 1.6, -0.15, 0.5, 11, 0.15, 0xd32f2f]], 'plain'));
  medal.position.set(316, 166, 437);
  const mhalo = new THREE.Sprite(haloMaterial(0xffd54f)); mhalo.scale.setScalar(8); medal.add(mhalo);
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
  for (const g of [bday, xmas, cake, mini, medal]) { g.visible = false; SCENE.add(g); }
  EVDECOR = { bday, xmas, cake, mini, lights, balloons, medal };
}

function applyEventDecor() {
  if (!EVDECOR || !G.ev) return;
  const E = G.ev, h = G.hour;
  EVDECOR.bday.visible = isBirthday();
  EVDECOR.balloons.forEach((b, i) => { const on = !(E.balloons && E.balloons[i]); b.ball.visible = b.string.visible = on; });
  EVDECOR.medal.visible = isBirthday() && !G.flags.medal;
  EVDECOR.cake.visible = isBirthday() && !E.cake && h >= 12;
  EVDECOR.xmas.visible = isXmasDeco();
  EVDECOR.mini.visible = isXmas() && !E.gift;
  W.vase.visible = !(E.acc && E.acc.done && E.acc.kind === 'vase');
}

function startEventsForDay(announce) {
  if (!G.ev || G.ev.day !== G.day) {
    removeEventPickups(); clearFootprints(); clearBalloons();
    const kinds = Object.keys(ACCIDENTS);
    G.ev = { day: G.day, acc: { at: rand(9.5, 18.5), kind: pick(kinds), done: false }, cleanAt: 0, cake: false, gift: false, partyAnn: false, xAnn: false, balloons: [] };
  }
  applyEventDecor();
  if (!announce) return;
  if (isBirthday()) setTimeout(() => toast('🎂 Aujourd’hui, c’est l’anniversaire de Léa ! Fête au salon de 16 h à 19 h… il restera sûrement des miettes de gâteau.' + (G.flags.medal ? '' : ' Une médaille d’or en chocolat pend à la guirlande au-dessus de la télé… Un ballon de la table basse pourrait t’y emmener !'), 'info', 9000), 600);
  else if (isXmas()) setTimeout(() => toast('🎄 Joyeux Noël ! Un minuscule paquet t’attend au pied du sapin du salon.', 'success'), 600);
  else if (isXmasDeco()) setTimeout(() => toast('🎄 Marc a installé le sapin de Noël dans le salon. Noël approche !', 'info'), 600);
}
function resetEvents() { removeEventPickups(); clearFootprints(); clearBalloons(); if (EVDECOR) for (const k of ['bday', 'xmas', 'cake', 'mini', 'medal']) EVDECOR[k].visible = false; if (W.vase) W.vase.visible = true; }
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
function updateEvents(dt) {
  updateFlyingBalloon(dt);
  huntTick(dt);
  if (!G.started || !G.ev || !EVDECOR || G.ev.day !== G.day) return;
  const E = G.ev, h = G.hour;
  if (isBirthday()) { creamTick(dt); tryGrabBalloon(); }
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

// ---------- crème du gâteau : traces de pas → Marc et Léa te cherchent pendant 1 h ----------
const CREAM = { feet: 0, acc: 0, side: 1, prints: [], mesh: null, seenT: 0 };
const PRINT_MAX = 90;
const _pm = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _pe = new THREE.Euler(), _pv = new THREE.Vector3(), _ps = new THREE.Vector3(1, 1, 1);
function clearFootprints() { CREAM.prints.length = 0; CREAM.feet = 0; if (CREAM.mesh) CREAM.mesh.count = 0; }
function addFootprint(x, y, z, ang) {
  if (!CREAM.mesh) {
    CREAM.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.06, 1.9), new THREE.MeshLambertMaterial({ color: 0xfff1f5, emissive: 0x3a2a2e }), PRINT_MAX);
    CREAM.mesh.frustumCulled = false; SCENE.add(CREAM.mesh);
  }
  if (CREAM.prints.length >= PRINT_MAX) CREAM.prints.shift();
  CREAM.prints.push({ x, y, z, ang });
  CREAM.prints.forEach((p, i) => { _pe.set(0, p.ang, 0); _pq.setFromEuler(_pe); _pv.set(p.x, p.y + 0.04, p.z); _pm.compose(_pv, _pq, _ps); CREAM.mesh.setMatrixAt(i, _pm); });
  CREAM.mesh.count = CREAM.prints.length; CREAM.mesh.instanceMatrix.needsUpdate = true;
}
function creamTick(dt) {
  const P = G.p;
  // marcher dans le gâteau (sur la table basse) met de la crème sous les pieds pour 40 pas
  if (EVDECOR.cake.visible && G.mode === 'walk' && P.y > 41 && P.y < 58 && dist2(P.x, P.z, 232, 625) < 16 && CREAM.feet < 30) {
    if (CREAM.feet <= 0) toast('🎂 Oups ! Tu as marché dans la crème du gâteau : tes pieds laissent des traces de chantilly partout où tu marches…', 'warn', 6000);
    CREAM.feet = 40;
  }
  if (CREAM.feet > 0 && G.mode === 'walk' && P.onGround) {
    CREAM.acc += Math.hypot(P.vx, P.vz) * dt;
    if (CREAM.acc > 3.2) {
      CREAM.acc = 0; CREAM.side = -CREAM.side;
      const a = Math.atan2(P.vx, P.vz), off = 0.7 * CREAM.side;
      addFootprint(P.x + Math.cos(a) * off, P.y, P.z - Math.sin(a) * off, a);
      if (--CREAM.feet === 0) toast('Tes pieds sont propres à nouveau.', 'info', 2500);
    }
  }
}
const huntActive = () => !!G.fx && (G.fx.huntUntil || 0) > G.time;
function huntTick(dt) {
  if (!G.started || !G.fx) return;
  if (G.fx.huntUntil && G.time >= G.fx.huntUntil) {
    G.fx.huntUntil = 0; clearFootprints();
    toast('😮‍💨 Marc et Léa abandonnent les recherches. Les traces de crème ont été essuyées.', 'success');
    return;
  }
  CREAM.seenT -= dt;
  if (huntActive()) {
    // ils fouillent autour des traces
    if (CREAM.seenT <= 0) { CREAM.seenT = 4; for (const h of HUMANS) if (h.state === 'routine' && !h.asleep && !h.away) h.investigate(G.fx.huntX + rand(-220, 220), G.fx.huntZ + rand(-160, 160), 0.5); }
    return;
  }
  if (!CREAM.prints.length || CREAM.seenT > 0) return;
  CREAM.seenT = 0.5;
  for (const h of HUMANS) {
    if (h.asleep || h.away) continue;
    for (let i = CREAM.prints.length - 1; i >= 0; i -= 3) {
      const p = CREAM.prints[i], dx = p.x - h.x, dz = p.z - h.z, d = Math.hypot(dx, dz);
      if (d > 380) continue;
      if (d > 90 && Math.abs(angWrap(Math.atan2(dx, dz) - h.ry)) > (CONFIG.human.fov * Math.PI) / 360) continue;
      if (!los(h.x, h.eyeY, h.z, p.x, p.y + 0.6, p.z)) continue;
      return startHunt(h, p);
    }
  }
}
function startHunt(h, p) {
  G.fx.huntUntil = G.time + 60; G.fx.huntX = p.x; G.fx.huntZ = p.z; CREAM.seenT = 0;
  SFX.play('alert'); G.dayStats.spotted = true;
  toast(`👣 ${h.name} a vu de minuscules traces de crème ! Marc et Léa te cherchent pendant 1 h et entendent le moindre de tes pas. Reste immobile dans une excellente cachette… ou rentre à ta base !`, 'danger', 9000);
  for (const o of HUMANS) if (!o.asleep && !o.away) o.investigate(p.x, p.z, 0.6);
}

// ---------- ballons d'anniversaire : s'accrocher en sautant depuis la table basse ----------
const BAL = { carry: null, fly: [], stuck: [] };
function tryGrabBalloon() {
  const P = G.p;
  if (G.mode !== 'walk' || P.onGround || !EVDECOR.bday.visible || G.breath.out || G.breath.v < 10) return;
  if (!(P.lastG > 40 && P.lastG < 47) || P.y < 44 || P.y > 80) return;   // en sautant depuis la table basse (43 cm)
  const taken = G.ev.balloons || (G.ev.balloons = []);
  EVDECOR.balloons.forEach((b, i) => { if (G.mode === 'walk' && !taken[i] && dist2(P.x, P.z, b.x, b.z) < 7) startBalloon(b, i); });
}
function balloonMesh(c) {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(9, 14, 10), new THREE.MeshLambertMaterial({ color: c })); ball.scale.y = 1.2; ball.position.y = 40.8; g.add(ball);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 30, 4), new THREE.MeshLambertMaterial({ color: 0xeeeeee })); s.position.y = 15; g.add(s);
  return g;
}
function startBalloon(b, i) {
  G.ev.balloons[i] = true; applyEventDecor();
  BAL.carry = balloonMesh(b.c); SCENE.add(BAL.carry);
  const P = G.p; G.mode = 'balloon'; G.crouch = false; P.vy = 0; P.airTop = undefined;
  SFX.play('whoosh', 0.6); Missions.event('balloon');
  toast('🎈 Tu t’accroches au ballon ! ZQSD/WASD : se diriger · Espace : monter · sinon tu redescends doucement. Tes bras fatiguent : surveille ton Souffle 💨 !', 'success', 7000);
}
function updateBalloon(dt) {
  const P = G.p, { fw, st } = moveInput(), [dx, dz] = camDir(fw, st), k = Math.min(1, dt * 2);
  P.vx = lerp(P.vx, dx * 45, k); P.vz = lerp(P.vz, dz * 45, k);
  P.vy = lerp(P.vy, Input.down('Space') && !UI.panel ? 32 : -9, Math.min(1, dt * 2.5));
  P.grav = 0; P.maxFall = 0;
  moveBody(P, dt);
  if (P.y > 192) { P.y = 192; P.vy = Math.min(0, P.vy); }
  G.sprinting = true;   // les bras fatiguent : le Souffle baisse comme en courant
  if (Math.hypot(P.vx, P.vz) > 3) G.face = Math.atan2(P.vx, P.vz);
  if (BAL.carry) BAL.carry.position.set(P.x, P.y + 6, P.z);
  if (!G.flags.medal && Math.hypot(P.x - 316, P.y + 6 - 166, P.z - 437) < 6) grabMedal();
  if (P.onGround) releaseBalloon(false);
  else if (G.breath.v <= 0) releaseBalloon(true);
}
function grabMedal() {
  G.flags.medal = true; giveItem('medaille', 1); EVDECOR.medal.visible = false;
  SFX.play('quest');
  toast('🏅 Tu as décroché la médaille d’or en chocolat ! Tant que tu l’as sur toi, ton Souffle dure plus longtemps.', 'success', 7000);
}
function releaseBalloon(tired) {
  const P = G.p;
  G.mode = 'walk'; P.grav = CONFIG.player.gravScale;
  if (BAL.carry) { BAL.fly.push(BAL.carry); BAL.carry = null; }
  if (tired) { P.vy = 0; P.onGround = false; P.airTop = P.y; G.fx.balloonFall = true; toast('😫 Tes bras n’en peuvent plus : tu lâches le ballon et tu tombes !', 'warn', 4000); }
  else { P.airTop = undefined; toast('Tu lâches le ballon : il s’envole jusqu’au plafond.', 'info', 3000); }
}
// atterrissage après avoir lâché le ballon : le tapis devant la télé amortit, le parquet fait mal
function balloonLanding(fall) {
  const P = G.p;
  if (P.chuted) return;
  if (P.y < 2 && inRect(P.x, P.z, W.zones.salonRug)) { toast('Ouf ! Le tapis moelleux devant la télé a amorti ta chute.', 'success'); return; }
  if (P.y < 2) { damage(clamp((fall - 20) * 0.4, 8, 30), 'Chute'); SFX.play('hurt'); toast('Aïe ! Tu es tombé sur le parquet… Vise le tapis devant la télé la prochaine fois !', 'warn'); }
  else if (fall > CONFIG.player.fallSafe) { damage((fall - CONFIG.player.fallSafe) * CONFIG.player.fallDmg, 'Chute'); SFX.play('hurt'); }
}
function updateFlyingBalloon(dt) {
  if (BAL.carry && G.mode !== 'balloon') { BAL.fly.push(BAL.carry); BAL.carry = null; }   // capturé, etc.
  for (let i = BAL.fly.length - 1; i >= 0; i--) {
    const g = BAL.fly[i]; g.position.y += 45 * dt; g.position.x += Math.sin(G.simT * 2 + i) * dt * 5;
    const inHouse = g.position.x > 0 && g.position.x < 1200 && g.position.z > 0 && g.position.z < 850;
    if (inHouse && g.position.y >= 198) { g.position.y = 198; BAL.stuck.push(g); BAL.fly.splice(i, 1); }   // collé au plafond
    else if (!inHouse && g.position.y > 900) { SCENE.remove(g); BAL.fly.splice(i, 1); }
  }
  if (BAL.stuck.length && G.ev && G.ev.day !== G.day) clearBalloons();
}
function clearBalloons() { for (const g of [...BAL.fly, ...BAL.stuck]) SCENE.remove(g); if (BAL.carry) SCENE.remove(BAL.carry); BAL.fly = []; BAL.stuck = []; BAL.carry = null; }
