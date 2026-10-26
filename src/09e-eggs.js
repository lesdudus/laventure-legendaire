// ------------------------------ CLINS D'ŒIL : INTERACTIONS ------------------------------
const EGG_NAMES = {
  tnt: 'la brique TNT', creeper: 'la figurine verte qui siffle', grass: "le bloc d'herbe", craft: "l'établi-jouet", furnace: 'le four-jouet', cake: 'le gâteau cubique',
  jukebox: 'le juke-box', pig: 'le cochon en peluche', ender: 'la grande silhouette aux yeux violets', torch: 'les torches', bed: 'le lit-jouet rouge', sign: 'le panneau gravé',
  ore: 'le bloc de minerai', pioche: 'la pioche en diamant', epee: "l'épée en diamant", pomme_or: 'la pomme dorée',
};
const CONFETTI = [];
function eggFound(id) {
  if (!G.egg || G.egg.found[id]) return;
  G.egg.found[id] = 1; G.stars++;
  toast(`🧱 Clin d'œil trouvé : ${EGG_NAMES[id]} (${Object.keys(G.egg.found).length}/${EGG_COUNT}) +1 ⭐`, 'success', 5000);
  SFX.play('quest');
}
function eggInteracts() {
  const E = G.egg, L = [];
  const today = (k) => E[k] === G.day;
  L.push({ ...EGGS.tnt, r: 16, label: today('tntDay') ? 'Brique TNT (déjà utilisée aujourd’hui)' : 'Allumer la mèche de la TNT 🧨', act: () => {
    eggFound('tnt');
    if (today('tntDay') || G.fuse) return toast('Il n’y a plus de mèche… Reviens demain.', 'info');
    E.tntDay = G.day; G.fuse = 2.5; SFX.play('fuse'); toast('Pssssss… Éloigne-toi !', 'warn', 2500);
  } });
  L.push({ ...EGGS.creeper, r: 26, label: 'Observer la figurine verte', act: () => { eggFound('creeper'); SFX.play('hiss', 0.6); toast('Une figurine verte, toute en pixels. Elle a l’air… explosive. Mieux vaut ne pas rester trop près.', 'info'); } });
  L.push({ ...EGGS.grass, r: 16, label: 'Secouer le bloc d’herbe', act: () => {
    eggFound('grass');
    if (today('grassDay')) return toast('Le bloc d’herbe n’a plus rien à donner aujourd’hui.', 'info');
    E.grassDay = G.day; giveItem('graine', 1); SFX.play('pickup'); toast('Une graine tombe du bloc d’herbe !', 'success');
  } });
  L.push({ ...EGGS.craft, r: 16, label: 'Utiliser l’établi-jouet', act: () => { eggFound('craft'); UI.open('craft'); } });
  L.push({ ...EGGS.furnace, r: 18, label: INV.count('fourmi') ? 'Faire griller une fourmi au four-jouet' : 'Four-jouet (il faut une fourmi)', act: () => {
    eggFound('furnace');
    if (!INV.count('fourmi')) return toast('Le four est chaud… mais tu n’as rien à griller. Une fourmi, peut-être ?', 'info');
    INV.remove('fourmi', 1); giveItem('fourmi_g', 1); EGGS.furnace.heat = 3; SFX.play('craft');
    Missions.event('craft', { id: 'fourmi_g' }); toast('🍢 Fourmi grillée au four, sans allumette !', 'success');
  } });
  if (E.cakeDay !== G.day) { E.cakeDay = G.day; E.cake = 6; }
  L.push({ ...EGGS.cake, r: 16, label: E.cake > 0 ? `Manger une part de gâteau (${E.cake}/6)` : 'Gâteau terminé (revient demain)', act: () => {
    eggFound('cake');
    if (E.cake <= 0) return toast('Plus une miette de gâteau. Demain peut-être !', 'info');
    E.cake--; applyEff({ nour: 10, energie: 5 }); G.flags.ate = true; SFX.play('eat'); Missions.event('eat', { id: 'gateau' });
    toast('🎂 Une part de gâteau : +10 nourriture, +5 énergie', 'success', 2500);
  } });
  L.push({ ...EGGS.jukebox, r: 16, label: 'Lancer le juke-box 🎵', act: () => {
    eggFound('jukebox'); SFX.play('melody'); emitNoise(EGGS.jukebox.x, 10, EGGS.jukebox.z, 300, 0.45, 'joueur');
    toast('🎵 Une petite mélodie 8 bits résonne… pas très discret !', 'warn');
  } });
  L.push({ ...EGGS.pig, r: 20, label: 'Câliner le cochon en peluche', act: () => { eggFound('pig'); SFX.play('oink'); toast('Oink ! La peluche couine quand on la serre.', 'info', 2500); } });
  L.push({ ...EGGS.bed, r: 18, label: 'Dormir dans le lit-jouet rouge', act: () => { eggFound('bed'); UI.openRest(); } });
  L.push({ ...EGGS.sign, r: 18, label: 'Lire le panneau', act: () => { eggFound('sign'); toast('« BIENVENUE À 5 CM » — et en dessous, gravé au cure-dent : « Attention au chien. Ne fixez pas la grande silhouette. »', 'info', 8000); } });
  L.push({ ...EGGS.ore, r: 18, label: INV.count('pioche') ? 'Miner le bloc de minerai ⛏️' : 'Bloc de minerai (il faut une pioche)', act: () => {
    eggFound('ore');
    if (!INV.count('pioche')) return toast('Des éclats bleus brillent dans la pierre… Il faudrait une pioche.', 'info');
    if (today('oreDay')) return toast('Le filon est épuisé pour aujourd’hui.', 'info');
    E.oreDay = G.day; giveItem('diamant', 1); SFX.play('break'); emitNoise(EGGS.ore.x, 5, EGGS.ore.z, 120, 0.3, 'joueur');
    toast('💎 Tu as miné un diamant !', 'success');
  } });
  return L;
}
function boom() {
  const T = EGGS.tnt, P = G.p;
  G.fuse = 0; SFX.play('boom'); G.shake = 1.4;
  $('flash').style.opacity = 0.5; setTimeout(() => ($('flash').style.opacity = 0), 160);
  emitNoise(T.x, 10, T.z, 520, 0.95, 'joueur');
  for (let i = 0; i < 40; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshBasicMaterial({ color: pick([0xff5252, 0xffeb3b, 0x69f0ae, 0x40c4ff, 0xe040fb, 0xffffff]) }));
    m.position.set(T.x, T.y + 10, T.z); SCENE.add(m);
    CONFETTI.push({ m, vx: rand(-60, 60), vy: rand(80, 220), vz: rand(-60, 60), t: 2.5 });
  }
  for (let i = 0; i < 3; i++) spawnPickup('cube', 1, T.x + rand(-14, 14), T.y, T.z + rand(-14, 14), null, { x: rand(-40, 40), y: 120, z: rand(-40, 40) });
  const d = dist2(P.x, P.z, T.x, T.z);
  if (d < 20 && G.mode === 'walk') { P.vx += (P.x - T.x) * 8; P.vz += (P.z - T.z) * 8; P.vy = 150; P.onGround = false; }
  toast('💥 BOUM ! Confettis et cubes partout… et toute la maison a entendu !', 'warn', 5000);
}
function placeEnder(i) {
  const s = EGGS.ender.spots[i];
  EGGS.ender.group.position.set(s[0], s[1], s[2]); EGGS.ender.group.rotation.y = s[3];
}
function updateEggs(dt) {
  if (!G.egg) return;
  if (G.fuse > 0) { G.fuse -= dt; EGGS.tnt.mesh.material.forEach((m) => m.emissive.setHex(Math.sin(G.fuse * 20) > 0 ? 0x444444 : 0)); if (G.fuse <= 0) { EGGS.tnt.mesh.material.forEach((m) => m.emissive.setHex(0)); boom(); } }
  for (let i = CONFETTI.length - 1; i >= 0; i--) {
    const c = CONFETTI[i]; c.t -= dt; c.vy -= 500 * dt;
    c.m.position.x += c.vx * dt; c.m.position.y = Math.max(0.5, c.m.position.y + c.vy * dt); c.m.position.z += c.vz * dt; c.m.rotation.x += dt * 8;
    if (c.t <= 0) { SCENE.remove(c.m); CONFETTI.splice(i, 1); }
  }
  // gâteau : taille selon les parts restantes
  const E = G.egg, cake = EGGS.cake, left = E.cakeDay === G.day ? E.cake : 6;
  if (cake.shown !== left) {
    cake.shown = left; cake.group.scale.x = Math.max(0.001, left / 6); cake.group.visible = left > 0;
    removeSolid(cake.solid);
    if (left > 0) cake.solid = addSolid(896, 75, 645, 896 + 14 * left / 6, 80, 659, 'egg');
  }
  // four : lueur la nuit ou pendant la cuisson
  const F = EGGS.furnace; F.heat = Math.max(0, F.heat - dt);
  F.mat.color.setHex(F.heat > 0 ? 0xff9800 : G.daylight < 0.5 ? 0xb5521c : 0x3a2a1a);
  for (const t of EGGS.torches) t.mesh.scale.setScalar(1 + Math.sin(G.simT * 9 + t.x) * 0.08);
  EGGS.ender.cool -= dt;
}
// 4 fois par seconde : découvertes par proximité ou par le regard
function eggPerception() {
  if (!G.egg || G.mode === 'jar' || G.mode === 'flight') return;
  const P = G.p, E = G.egg;
  const cr = EGGS.creeper;
  if (dist2(P.x, P.z, cr.x, cr.z) < 30 && P.y < 25) {
    if ((E.hissT || 0) < G.simT) { E.hissT = G.simT + 40; SFX.play('hiss'); toast('Sssssss… Ouf, ce n’est qu’une figurine.', 'warn', 3000); }
    eggFound('creeper');
  }
  for (const t of EGGS.torches) if (dist2(P.x, P.z, t.x, t.z) < 35 && Math.abs(P.y - t.y) < 20) eggFound('torch');
  const en = EGGS.ender, g = en.group.position;
  if (en.cool <= 0) {
    const e = eyePos(), f = camForward(), hx = g.x, hy = g.y + 28, hz = g.z;
    const dx = hx - e.x, dy = hy - e.y, dz = hz - e.z, d = Math.hypot(dx, dy, dz);
    if (d < 220 && (dx * f.x + dy * f.y + dz * f.z) / d > 0.985 && los(e.x, e.y, e.z, hx, hy, hz)) {
      en.cool = 4; let n = E.endSpot; while (n === E.endSpot) n = Math.floor(Math.random() * en.spots.length);
      E.endSpot = n; SFX.play('teleport'); placeEnder(n); eggFound('ender');
      toast('La grande silhouette a disparu dans un nuage violet… Il ne fallait pas la regarder dans les yeux.', 'warn', 5000);
    }
  }
}
