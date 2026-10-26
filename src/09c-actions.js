// ------------------------------ ACTIONS : INTERAGIR, UTILISER, CONSTRUIRE ------------------------------
function giveItem(id, n = 1) {
  const left = INV.add(id, n);
  if (left) { dropFromPlayer(id, left); toast(`Inventaire plein : ${ITEMS[id].name} posé au sol.`, 'warn'); }
  if (id === 'carte') G.minimap = true;
  UI.dirty = true;
}
// Grille globale (comme Minecraft) : cases de CONFIG.cube cm, bords sur les multiples de 10
const gridSnap = (v) => Math.floor(v / CONFIG.cube) * CONFIG.cube + CONFIG.cube / 2;
// Objet posé : au centre de la case visée (ou de la case juste devant soi), sur la surface réelle
function dropFromPlayer(id, n) {
  const P = G.p, hit = G.mode === 'walk' ? aimHit() : null;
  let x, z, y;
  if (hit && hit.n[1] === 1) { x = gridSnap(hit.x); z = gridSnap(hit.z); y = groundAt(x, z, 0.5, hit.y + 0.5); }
  else {
    const a = G.yaw + Math.PI;
    x = gridSnap(P.x + Math.sin(a) * 7); z = gridSnap(P.z + Math.cos(a) * 7); y = groundAt(x, z, 0.5, P.y + 2);
  }
  spawnPickup(id, n, x, y, z);
  UI.dirty = true;
}
function applyEff(eff) { for (const k in eff) if (k in G.s) G.s[k] = clamp(G.s[k] + eff[k], 0, 100); }
function damage(n, why) {
  G.s.vie = Math.max(0, G.s.vie - n);
  $('flash').style.opacity = 0.35; setTimeout(() => ($('flash').style.opacity = 0), 120);
  if (why) toast(`${why} : -${Math.round(n)} vie`, 'danger');
  if (G.s.vie <= 0) gameOver('Tu t’es évanoui…', 'Tes forces t’ont lâché. Léa t’a trouvé endormi au milieu du salon et t’a installé dans sa maison de poupée… pour toujours.');
}

function consume(i) {
  const s = INV.slots[i]; if (!s) return;
  const it = ITEMS[s.id], id = s.id;
  INV.takeAt(i, 1);
  applyEff(it.eff || {});
  if (it.back) INV.add(it.back, 1);
  if (it.type === 'food') { G.flags.ate = true; SFX.play(it.noisy ? 'crunch' : 'eat'); Missions.event('eat', { id }); }
  else { G.flags.drank = true; SFX.play('drink'); Missions.event('drink', { id }); }
  if (it.noisy) { emitNoise(G.p.x, G.p.y, G.p.z, 110, 0.5, 'joueur'); toast('CRRRUNCH ! Ça s’entend de loin…', 'warn'); }
  if (it.crash) G.fx.crash = G.simT + 60;
  if (it.hiccup) { G.fx.hicUntil = G.simT + 45; G.fx.hicNext = G.simT + 4; }
  if (it.feast) { G.fx.feastUntil = G.time + 24 * 60; SFX.play('quest'); toast('🍖 Festin ! Ta Nourriture reste pleine pendant 1 jour de jeu.', 'success'); }
  toast(`${it.icon} ${it.name} : ${effText(it.eff)}`, 'success', 2500);
  UI.dirty = true;
}
function useInvSlot(i) {
  const s = INV.slots[i]; if (!s) return;
  const it = ITEMS[s.id];
  if (it.type === 'food' || it.type === 'drink') return consume(i);
  if (s.id === 'cube') { if (UI.panel) return toast('Ferme l’inventaire et vise un emplacement (clic droit).', 'info'); G.sel = i < CONFIG.hotbar ? i : G.sel; return placeCube(); }
  if (s.id === 'kit_base') return installBase2(i);
  if (s.id === 'carte') { G.minimap = !G.minimap; return; }
  if (s.id === 'voiture') return deployCar(i);
  if (s.id === 'tenue_invis') return toggleInvis();
  if (s.id === 'cristal') return toast(G.invis.on ? 'Le cristal sera utilisé automatiquement quand la charge actuelle sera vide.' : 'Active la tenue d’invisibilité 🫥 (clic droit) : elle utilisera ce cristal.', 'info');
  if (s.id === 'armure') {
    G.armor.on = !G.armor.on; if (G.armor.on && !G.armor.dur) G.armor.dur = 5; SFX.play('place'); refreshEquip();
    return toast(G.armor.on ? `🛡️ Armure enfilée (${G.armor.dur} morsure${G.armor.dur > 1 ? 's' : ''} avant usure).` : 'Armure retirée.', 'info');
  }
  if (s.id === 'ailerons') { INV.takeAt(i, 1); G.upgrades.ailerons = true; SFX.play('craft'); UI.dirty = true; return toast('🪽 Ailerons installés ! En l’air, maintiens Espace pour planer avec la voiture.', 'success'); }
  if (s.id === 'avion') return toast('Va sur un point haut (rebord de la fenêtre du salon, table du jardin) et appuie sur E.', 'info');
  if (s.id === 'parachute') return toast('Maintiens Espace pendant une chute pour planer.', 'info');
  if (it.throwable) return toast('Appuie sur G pour lancer cet objet.', 'info');
  toast(it.desc, 'info');
}
function throwSelected() {
  const s = INV.slots[G.sel];
  if (!s || G.mode !== 'walk') return;
  if (ITEMS[s.id].quest) return toast('Pas question de lancer un objet de quête !', 'warn');
  if (ITEMS[s.id].keep) return toast('Cet objet est trop précieux pour être lancé.', 'warn');
  const id = s.id; INV.takeAt(G.sel, 1);
  const f = camForward(), P = G.p;
  spawnPickup(id, 1, P.x + f.x * 2, P.y + 4, P.z + f.z * 2, null, { x: f.x * 190, y: 90 + f.y * 150, z: f.z * 190 });
  SFX.play('whoosh', 0.5); UI.dirty = true;
}
function onItemLanded(p) {
  if ((p.id === 'croquette' || p.id === 'balle') && Dog && Dog.state !== 'distracted') Dog.distract(p);
}

// ---------- cubes en bois ----------
function addCube(x, y, z, v = 0, sfx = true) {
  const h = CONFIG.cube / 2;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.cube, CONFIG.cube, CONFIG.cube), cubeMaterials()[v % 4]);
  mesh.position.set(x, y + h, z); SCENE.add(mesh);
  const solid = addSolid(x - h, y, z - h, x + h, y + CONFIG.cube, z + h, 'cube');
  const c = { x, y, z, v, mesh, solid }; solid.cube = c; CUBES.push(c);
  if (sfx) { SFX.play('place'); rebuildAnimalNav(); }
  return c;
}
function removeCube(c, give = true) {
  removeSolid(c.solid); SCENE.remove(c.mesh);
  const i = CUBES.indexOf(c); if (i >= 0) CUBES.splice(i, 1);
  if (give) { giveItem('cube', 1); SFX.play('break'); rebuildAnimalNav(); emitNoise(c.x, c.y, c.z, 70, 0.2, 'joueur'); }
}
function rebuildAnimalNav() {
  for (const g of [NAV.dog, NAV.cat]) { g.block.fill(0); for (const s of SOLIDS) if (!s.off && g.test(s)) g.mark(s, 1); }
  markCastleNav([NAV.dog, NAV.cat]);
}
function eyePos() { const P = G.p; return { x: P.x, y: P.y + (G.crouch ? CONFIG.player.crouchEye : CONFIG.player.eye), z: P.z }; }
function aimHit() {
  const e = eyePos(), f = camForward();
  return raycast(e.x, e.y, e.z, f.x, f.y, f.z, CONFIG.player.buildReach, (s) => s.tag !== 'glass');
}
// Calcule la case où le cube visé serait posé : { x, y, z, ok, msg } ou null si rien de visé
function cubePlacement() {
  const hit = aimHit(); if (!hit) return null;
  const C = CONFIG.cube, h = C / 2, P = G.p, cb = hit.s.cube;
  let cx, cz, y0;
  if (cb) {
    // collé exactement contre la face visée du cube
    cx = cb.x + hit.n[0] * C; cz = cb.z + hit.n[2] * C; y0 = cb.y + hit.n[1] * C;
    if (hit.n[1] === -1 && y0 < groundAt(cx, cz, h - 0.1, cb.y) - 0.05) return { x: cx, y: y0, z: cz, ok: false, msg: 'Pas de place sous ce cube.' };
  } else if (hit.n[1] === 1) {
    cx = gridSnap(hit.x); cz = gridSnap(hit.z); y0 = groundAt(cx, cz, h - 0.1, hit.y + 0.5);
  } else if (hit.n[1] === -1) return null;
  else {
    cx = gridSnap(hit.x + hit.n[0] * h); cz = gridSnap(hit.z + hit.n[2] * h);
    y0 = groundAt(cx, cz, h - 0.1, hit.y + 0.01);
  }
  const res = { x: cx, y: y0, z: cz, ok: true, msg: '' };
  const fail = (msg) => { res.ok = false; res.msg = msg; return res; };
  const inCell = (x, z, r, y, top) => Math.abs(x - cx) < h + r && Math.abs(z - cz) < h + r && y < y0 + C - 0.05 && top > y0 + 0.05;
  for (const q of querySolids(cx - h + 0.05, cz - h + 0.05, cx + h - 0.05, cz + h - 0.05)) if (q.y1 > y0 + 0.05 && q.y0 < y0 + C - 0.05) return fail('Pas assez de place ici.');
  if (inCell(P.x, P.z, P.r, P.y, P.y + P.h)) return fail('Tu es dans le chemin ! Saute pour poser un cube sous tes pieds.');
  for (const H of HUMANS) if (!H.away && inCell(H.x, H.z, 14, 0, 180)) return fail('Un humain est dans le chemin !');
  if (Dog && inCell(Dog.x, Dog.z, 30, 0, 90)) return fail('Rex est dans le chemin !');
  if (Cat && inCell(Cat.x, Cat.z, 18, Cat.y || 0, (Cat.y || 0) + 35)) return fail('Moustache est dans le chemin !');
  const Cc = G.car; if (!carStowed() && inCell(Cc.x, Cc.z, Cc.r, Cc.y, Cc.y + 5)) return fail('Ta voiture est dans le chemin !');
  return res;
}
function placeCube() {
  if (G.mode !== 'walk') return;
  const s = INV.slots[G.sel]; if (!s || s.id !== 'cube') return;
  if (isExploring() && SETTINGS.exploreNoPlace) return toast('🧭 Mode exploration : appuie sur B pour repasser en mode construction.', 'info', 2000);
  const pl = cubePlacement();
  if (!pl) return toast('Vise une surface plus proche pour poser le cube.', 'info', 1800);
  if (!pl.ok) return toast(pl.msg, 'warn', 1800);
  INV.takeAt(G.sel, 1); addCube(pl.x, pl.y, pl.z, Math.floor(Math.random() * 4));
  Missions.event('place'); UI.dirty = true;
}
// Aperçu de construction : « cube » (cube transparent), « sol » (face au sol seulement), « aretes » (contour seul), « aucun »
const GHOST_MODES = { cube: 'Cube transparent', sol: 'Face au sol seulement', aretes: 'Arêtes seules', aucun: 'Aucun aperçu' };
const isExploring = () => SETTINGS.buildMode === 'explore';
const ghostMode = () => (isExploring() ? SETTINGS.ghostExplore : SETTINGS.ghostBuild) || 'cube';
// Touche B : bascule entre le mode construction et le mode exploration
function toggleBuildMode() {
  SETTINGS.buildMode = isExploring() ? 'build' : 'explore'; saveSettings();
  const ex = isExploring();
  toast(ex ? `🧭 Mode exploration · aperçu : ${GHOST_MODES[ghostMode()]}${SETTINGS.exploreNoPlace ? ' · le clic droit ne pose pas de cube' : ''}` : `🧱 Mode construction · aperçu : ${GHOST_MODES[ghostMode()]}`, 'info', 2500);
  UI.dirty = true;
}
// Silhouette fantôme de la case visée quand un cube est en main
let CUBE_GHOST = null;
function updateCubeGhost() {
  const s = INV.slots[G.sel], mode = ghostMode();
  const want = G.started && G.mode === 'walk' && !UI.panel && !G.rest && s && s.id === 'cube' && mode !== 'aucun';
  const pl = want ? cubePlacement() : null;
  if (!pl) { if (CUBE_GHOST) CUBE_GHOST.visible = false; return; }
  if (!CUBE_GHOST) {
    const C = CONFIG.cube, e = C + 0.12, g = new THREE.BoxGeometry(e, e, e);
    const lineMat = () => new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false });
    const fillMat = (o) => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide });
    CUBE_GHOST = new THREE.Group();
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g), lineMat());
    const fill = new THREE.Mesh(g, fillMat(0.16));
    const floor = new THREE.Group(), y = -C / 2 + 0.08, h = e / 2;
    const sq = new THREE.BufferGeometry().setFromPoints([[-h, -h], [h, -h], [h, h], [-h, h], [-h, -h]].map(([x, z]) => new THREE.Vector3(x, y, z)));
    floor.add(new THREE.Line(sq, lineMat()));
    const pg = new THREE.PlaneGeometry(e, e); pg.rotateX(-Math.PI / 2); pg.translate(0, y, 0);
    floor.add(new THREE.Mesh(pg, fillMat(0.3)));
    CUBE_GHOST.add(edges, fill, floor);
    CUBE_GHOST.userData = { edges, fill, floor };
    CUBE_GHOST.traverse((o) => { o.renderOrder = 10; });
    SCENE.add(CUBE_GHOST);
  }
  const u = CUBE_GHOST.userData, col = pl.ok ? 0xffffff : 0xff4d4d;
  u.edges.visible = mode === 'cube' || mode === 'aretes'; u.fill.visible = mode === 'cube'; u.floor.visible = mode === 'sol';
  u.edges.material.color.setHex(col); u.fill.material.color.setHex(col);
  for (const c of u.floor.children) c.material.color.setHex(col);
  CUBE_GHOST.position.set(pl.x, pl.y + CONFIG.cube / 2, pl.z); CUBE_GHOST.visible = true;
}
// Anciennes sauvegardes : recaler les cubes sur la grille sans les enfoncer ni les superposer
function snapSavedCubes(list) {
  const C = CONFIG.cube, h = C / 2;
  for (const c of list.slice().sort((a, b) => a[1] - b[1])) {
    const x = gridSnap(c[0]), z = gridSnap(c[2]); let y = c[1];
    for (let k = 0; k < 40; k++) {
      let top = null;
      for (const q of querySolids(x - h + 0.05, z - h + 0.05, x + h - 0.05, z + h - 0.05)) if (q.y1 > y + 0.05 && q.y0 < y + C - 0.05) top = Math.max(top ?? -1e9, q.y1);
      if (top === null) break;
      y = top;
    }
    addCube(x, y, z, c[3], false);
  }
}
function breakCube() {
  if (G.mode !== 'walk') return;
  const hit = aimHit();
  if (hit && hit.s.cube) removeCube(hit.s.cube, true);
}
function placeBase2Mesh() {
  if (G.base2Mesh) SCENE.remove(G.base2Mesh);
  const b = G.base2;
  G.base2Mesh = meshBoxes([[b.x - 9, b.y, b.z - 5, b.x + 9, b.y + 3, b.z + 5, 0xf2d24c], [b.x - 9, b.y + 3, b.z - 5, b.x + 9, b.y + 3.6, b.z + 5, 0x3fa34d],
    [b.x + 10, b.y, b.z - 4, b.x + 17, b.y + 6, b.z + 3, 0x2f5d8a], [b.x - 13, b.y, b.z - 1, b.x - 12.4, b.y + 10, b.z - 0.4, 0xe8d5b5], [b.x - 12.4, b.y + 6, b.z - 0.9, b.x - 8, b.y + 9, b.z - 0.5, 0xb11f4b]], 'plain');
  SCENE.add(G.base2Mesh);
}
function installBase2(i) {
  const P = G.p;
  if (G.mode !== 'walk' || !P.onGround) return toast('Pose-toi au sol pour installer la base.', 'warn');
  if (inBaseArea(P.x, P.y, P.z)) return toast('Tu es déjà dans ta base principale !', 'info');
  const s = hideScore(P.x, P.y, P.z);
  if (s < 50) return toast(`Cachette trop exposée (${s}/100). Il faut au moins 50.`, 'warn');
  INV.takeAt(i, 1);
  G.base2 = { x: P.x, y: P.y, z: P.z }; placeBase2Mesh();
  toast('🏕️ Résidence secondaire installée ! Tu peux y dormir en sécurité.', 'success'); SFX.play('craft');
  UI.dirty = true;
}
function craft(r, at = 'atelier') {
  if (!r || !INV.has(r.in) || !recipeUnlocked(r) || recipeDone(r)) return;
  if (recipeWhere(r) === 'bbq' && at !== 'bbq') return toast('Cette recette se prépare sur le barbecue chaud du jardin.', 'warn');
  if (at === 'main' && recipeWhere(r) !== 'main') return toast('Cette recette demande l’établi.', 'warn');
  for (const k in r.in) INV.remove(k, r.in[k]);
  if (r.up) { G.upgrades[r.up] = true; toast(`${UPGRADES[r.up].icon} ${UPGRADES[r.up].name} installé sur la voiture !`, 'success'); Missions.event('craft', { id: r.up }); }
  else if (r.base) { G.baseUp[r.base] = true; refreshBase(); toast(`${BASE_UPS[r.base].icon} ${BASE_UPS[r.base].name} installé dans ta base ! ${BASE_UPS[r.base].desc}`, 'success'); Missions.event('craft', { id: r.base }); }
  else {
    giveItem(r.out, r.n); if (r.out === 'armure') G.armor.dur = 5;
    toast(`${ITEMS[r.out].icon} ${ITEMS[r.out].name} fabriqué !`, 'success'); Missions.event('craft', { id: r.out });
  }
  SFX.play('craft'); UI.dirty = true;
}

// ---------- interactions ----------
const FISH_TIPS = [
  'Sous le canapé, les lits ou le meuble télé, les mains des humains ne peuvent pas t’atteindre. Blub.',
  'Rex suit ton odeur à la trace. Les flaques d’eau effacent ta piste.',
  'Ta voiture est rapide mais bruyante. Un silencieux (coton + bouchon) fait des merveilles.',
  'Accroupi (C) dans l’ombre, tu deviens presque invisible.',
  'Dormir dans ta base est sans risque. Ailleurs, regarde le score de cachette avant de fermer les yeux.',
  'Quand Moustache t’aime bien, il distrait les humains et fait fuir Rex.',
  'Monte sur le dos de Moustache (F) : personne ne te voit, et il bondit à 1,30 m ! Des cartons, des boîtes et un panier en osier l’aident à grimper tout en haut.',
  'Coincé dans le jardin ? Un petit trou au pied de la cabane mène à un cagibi. Grimpe jusqu’à la fenêtre et suis la corde à linge jusqu’au vasistas de la cuisine. Blub !',
  'Les cubes en bois permettent de grimper partout : saute et pose un cube sous tes pieds !',
  'Le soda donne le hoquet… et le hoquet, ça s’entend.',
  'La nuit, les humains dorment… mais Rex patrouille.',
  'Les chips, c’est bon, mais c’est le bruit le plus fort de la maison.',
];
function schedEnd(who, h) { for (const [a, b] of schedTable(who)) if (h >= a && h < b) return fmtClock(b * 60); return ''; }
function fishReport() {
  const h = G.hour;
  const dogTxt = { sleep: 'dort', idle: 'est réveillé et surveille', patrol: 'patrouille dans la maison' }[dogSchedAt(h)];
  let end = ''; for (const [a, b] of DOG_SCHED) if (h >= a && h < b) end = fmtClock(b * 60);
  const dn = doorNext(), doorTxt = doorAired() ? `ouverte pour aérer jusqu’à ${fmtClock(dn.at * 60)}` : dn ? `fermée (elle s’ouvrira à ${fmtClock(dn.at * 60)})` : 'fermée jusqu’à demain';
  return `Blub… Il est ${fmtClock(G.time % 1440)}. Marc ${ACT_LABEL[schedAt('marc', h)]} jusqu’à ${schedEnd('marc', h)}. Léa ${ACT_LABEL[schedAt('lea', h)]} jusqu’à ${schedEnd('lea', h)}. Rex ${dogTxt} jusqu’à ${end}. La fenêtre du salon est ${W.pane.open ? 'ouverte' : 'fermée (elle s’ouvre de 9h à 19h)'}. La porte du jardin est ${doorTxt}.`;
}
function talkFish() {
  Missions.event('talkFish'); SFX.play('bubble');
  const opts = [];
  if (!G.flags.fishPlan) opts.push({ label: '« Comment quitter cette maison ? »', fn: () => { G.flags.fishPlan = true; SFX.play('bubble'); UI.dialog('Bubulle 🐟', 'Blub… La cabane au fond du jardin ! Le Petit Peuple y vit. Son seul accès : la lucarne sur le toit. Il te faut un avion en papier motorisé : une feuille (sur le bureau), un élastique (sur la table de la cuisine), un trombone (près de l’imprimante) et une pile (sous le meuble télé). Assemble-le à ton établi, puis lance-toi depuis le rebord de la fenêtre du salon. Blub !', [{ label: 'Merci, Bubulle !' }]); } });
  if (!G.flags.ringGiven) opts.push({
    label: INV.count('cereale') ? '« Voici un flocon de céréale géant. »' : '« Qu’est-ce qui brille au fond ? »',
    fn: () => {
      if (INV.count('cereale')) { INV.remove('cereale', 1); giveItem('bague', 1); G.flags.ringGiven = true; SFX.play('bubble'); UI.dialog('Bubulle 🐟', 'Miam ! Blub… Tiens, voilà la bague que Marc cherche partout depuis des semaines. Pose-la sur sa table de nuit, il sera de bonne humeur.', [{ label: 'Merci !' }]); }
      else UI.dialog('Bubulle 🐟', 'Une bague dorée… Je te la pousse vers la surface si tu m’apportes un flocon de céréale géant. Il y en a souvent par terre dans la cuisine. Blub.', [{ label: 'D’accord.' }]);
    },
  });
  opts.push({ label: '« Qu’as-tu vu, Bubulle ? »', fn: () => UI.dialog('Bubulle 🐟', fishReport(), [{ label: 'Merci.' }]) });
  if (isBirthday() && !G.flags.medal) opts.push({ label: '« Que se passe-t-il au salon ? »', fn: () => UI.dialog('Bubulle 🐟', 'Blub ! C’est l’anniversaire de Léa. J’ai vu une médaille d’or en chocolat accrochée tout en haut de la guirlande, juste au-dessus de la télé. Personne ne peut l’atteindre… sauf quelqu’un qui s’envolerait avec un ballon ! Saute depuis la table basse pour en attraper un. Si tes bras fatiguent, vise le tapis moelleux devant la télé. Et ne marche pas dans le gâteau : la crème laisse des traces… Blub.', [{ label: 'Merci, Bubulle !' }]) });
  if (INV.count('diamant')) opts.push({ label: '« Regarde ce diamant ! »', fn: () => { INV.remove('diamant', 1); giveItem('pomme_or', 1); SFX.play('bubble'); UI.dialog('Bubulle 🐟', 'Blub ! Qu’il brille ! En échange, voici une pomme dorée tombée dans mon bocal le jour où Léa a renversé son panier de jouets.', [{ label: 'Merci, Bubulle !' }]); } });
  opts.push({ label: '« Un conseil ? »', fn: () => UI.dialog('Bubulle 🐟', pick(FISH_TIPS), [{ label: 'Compris.' }]) });
  opts.push({ label: 'Au revoir.' });
  UI.dialog('Bubulle 🐟', pick(['Blub ! Un visiteur minuscule !', 'Blub blub… Encore toi ? J’adore les visites.', 'Je vois tout depuis mon bocal… Blub.']), opts);
}
function fillCap() { INV.remove('bouchon', 1); giveItem('eau_bouchon', 1); SFX.play('splash'); toast('Bouchon rempli d’eau !', 'success'); }
function drinkAt(kind) {
  if (INV.count('bouchon') && kind !== 'jardin') return fillCap();
  if (kind === 'dog') {
    applyEff({ nour: 8 }); G.flags.drank = true; SFX.play('drink'); Missions.event('drink', { id: 'eau_chien' });
    toast('Glou glou… (+8 nourriture) Ça sent le chien.', 'success');
    if (dist2(Dog.x, Dog.z, 786, 826) < 400 && (Dog.awake || Math.random() < 0.5)) { Dog.alert(786, 826, 10); toast('Rex a entendu quelque chose…', 'warn'); }
  } else if (kind === 'bain') {
    // flaque du bain : 3 gorgées par soir, elle rétrécit, la 3e a un goût de savon (hoquet à bulles)
    const n = bathSips();
    if (n >= 3) return toast('La flaque du bain a séché. Il faudra attendre le prochain bain de Léa !', 'info');
    G.flags.bath = { d: G.day, n: n + 1 };
    if (INV.count('bouchon')) { fillCap(); toast(n + 1 >= 3 ? 'C’était la dernière eau de la flaque du bain : elle a séché.' : `La flaque du bain rétrécit : encore ${2 - n} gorgée${2 - n > 1 ? 's' : ''} ce soir.`, 'info'); return; }
    applyEff({ nour: 5 }); G.flags.drank = true; SFX.play('drink'); Missions.event('drink', { id: 'flaque' });
    if (n + 1 >= 3) { G.fx.hicUntil = G.simT + 20; G.fx.hicNext = G.simT + 3; toast('Beurk, un goût de savon ! (+5 nourriture) Tu as le hoquet à bulles… et la flaque du bain a séché.', 'warn', 6000); }
    else toast(`Tu bois dans la flaque du bain (+5 nourriture). L’eau a un petit goût de savon… Elle rétrécit : encore ${2 - n} gorgée${2 - n > 1 ? 's' : ''} ce soir.`, 'success', 5000);
  } else if (kind === 'jardin') {
    // flaques du jardin : 2 gorgées maximum par jour (l'eau n'est peut-être pas propre)
    const n = puddleSips();
    if (n >= 2) return toast('🤢 Beurk… Tu as déjà bu 2 fois dans les flaques du jardin aujourd’hui. Cette eau n’est peut-être pas propre : en boire encore pourrait te rendre malade. Reviens demain !', 'warn', 6000);
    G.flags.puddle = { d: G.day, n: n + 1 };
    applyEff({ nour: 5 }); G.flags.drank = true; SFX.play('drink'); Missions.event('drink', { id: 'flaque' });
    toast((n === 0
      ? 'Tu bois dans la flaque (+5 nourriture). Attention : cette eau n’est peut-être pas propre. Plus de 2 gorgées par jour pourraient te rendre malade !'
      : 'Tu bois dans la flaque (+5 nourriture). C’est ta 2e gorgée aujourd’hui : plus une goutte de cette eau avant demain, tu risquerais d’être malade !')
      + (INV.count('bouchon') ? ' Tu ne remplis pas ton bouchon ici : il risquerait d’être sali.' : ''), 'warn', 6000);
  } else { applyEff({ nour: 5 }); G.flags.drank = true; SFX.play('drink'); Missions.event('drink', { id: 'flaque' }); toast('Tu bois dans la flaque (+5 nourriture).', 'success'); }
}
const puddleSips = () => (G.flags.puddle && G.flags.puddle.d === G.day ? G.flags.puddle.n : 0);
const bathSips = () => (G.flags.bath && G.flags.bath.d === G.day ? G.flags.bath.n : 0);
// flaque laissée par le bain de Léa (20 h 30 → minuit) : rétrécit à chaque gorgée
let _bathPuddle = null;
function updateBathPuddle() {
  if (!_bathPuddle) {
    const g = new THREE.Group();
    const water = new THREE.Mesh(new THREE.CircleGeometry(14, 20), new THREE.MeshLambertMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.7, emissive: 0x16323f, depthWrite: false }));
    water.rotation.x = -Math.PI / 2; g.add(water);
    const bub = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, emissive: 0x555555 });
    for (const [x, z, r] of [[-5, 3, 1.2], [4, -4, 0.9], [6, 5, 0.7], [-2, -6, 0.8]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), bub); b.position.set(x, 0.1, z); b.scale.y = 0.5; g.add(b); }
    g.position.set(560, 0.86, 102); W.scene.add(g); _bathPuddle = g;
  }
  const left = 3 - bathSips(), on = G.hour >= 20.5 && left > 0;
  _bathPuddle.visible = on;
  if (on) _bathPuddle.scale.setScalar([0, 0.45, 0.72, 1][left]);
}
function petCat() {
  const s = INV.slots[G.sel], it = s && ITEMS[s.id];
  if (it && (it.type === 'food' || it.type === 'drink')) {
    INV.takeAt(G.sel, 1); const gain = it.catFood || 6;
    G.cat.aff = Math.min(100, G.cat.aff + gain); SFX.play('purr'); toast(`Moustache apprécie : ${it.name} (+${gain} affection → ${Math.floor(G.cat.aff)})`, 'success'); Missions.event('feedCat');
  } else if (G.simT - G.cat.petT < 15) { toast('Moustache a déjà eu sa caresse. Reviens dans un instant.', 'info', 2000); return; }
  else { G.cat.petT = G.simT; G.cat.aff = Math.min(100, G.cat.aff + 5); SFX.play('purr'); toast(`Ronron… (+5 affection → ${Math.floor(G.cat.aff)})`, 'success', 2500); Missions.event('pet'); }
  UI.dirty = true;
}
function callCat() {
  if (G.mode !== 'walk') return;
  if (G.cat.aff < 20) return toast('Moustache ne te connaît pas assez (affection 20 requise).', 'info');
  Cat.call(); toast('Psst, Moustache ! Il arrive.', 'info', 2000);
}
function staticInteracts() {
  const L = [
    { ...W.base.bed, r: 16, label: 'Se reposer / dormir (T)', act: () => UI.openRest() },
    { ...W.base.chest, r: 14, label: 'Ouvrir le coffre (50 places)', act: () => UI.open('chest') },
    { ...W.base.bench, r: 13, label: 'Utiliser l’établi', act: () => UI.open('craft') },
    { ...W.base.couture, r: 12, label: '🧵 Atelier de couture (ta tenue)', act: () => UI.open('look') },
    { x: 64, y: 0, z: 735, r: 42, ymax: 110, label: 'Parler à Bubulle 🐟', act: () => talkFish() },
    { x: 786, y: 6, z: 826, r: 17, label: INV.count('bouchon') ? 'Remplir le bouchon (gamelle)' : 'Boire à la gamelle de Rex', act: () => drinkAt('dog') },
  ];
  if (INV.count('bouchon')) L.push({ x: 680, y: 0.3, z: 204, r: 16, label: 'Remplir le bouchon (fuite)', act: () => fillCap() });
  if (INV.count('bague')) L.push({ x: 115, y: 55, z: 48, r: 18, label: 'Déposer la bague 💍', act: () => { INV.remove('bague', 1); G.flags.ringReturned = true; SFX.play('quest'); toast('La bague est sur la table de nuit. Marc va être ravi !', 'success'); } });
  for (const p of W.puddles) L.push({ x: p.x, y: 0, z: p.z, r: p.r, label: (() => { const left = Math.max(0, 2 - puddleSips()); return left ? `Boire dans la flaque (encore ${left} gorgée${left > 1 ? 's' : ''} aujourd’hui)` : 'Flaque : plus de gorgée aujourd’hui 🤢'; })(), act: () => drinkAt('jardin') });
  if (G.hour >= 20.5 && bathSips() < 3) { const left = 3 - bathSips(); L.push({ x: 560, y: 0.3, z: 100, r: 20, label: INV.count('bouchon') ? `Remplir le bouchon (flaque du bain · encore ${left} gorgée${left > 1 ? 's' : ''})` : `Boire dans la flaque du bain (encore ${left} gorgée${left > 1 ? 's' : ''} ce soir)`, act: () => drinkAt('bain') }); }
  if (G.base2) L.push({ x: G.base2.x, y: G.base2.y, z: G.base2.z, r: 14, label: 'Se reposer / dormir (T)', act: () => UI.openRest() });
  if (G.baseUp.garage && inBaseArea(G.p.x, G.p.y, G.p.z)) L.push({ x: 957, y: 0, z: 6, r: 22, label: '🅿️ Rappeler la voiture au garage', act: recallCar });
  L.push(...eventInteracts());
  L.push(...eggInteracts());
  L.push(...castleInteracts());
  L.push(...bbqInteracts());
  return L;
}
function findInteraction() {
  const P = G.p;
  if (G.mode === 'car') {
    if (dist2(P.x, P.z, 440, 560) < 35 && !G.race) return { label: '🏁 Lancer le Grand Prix du Salon', act: startRace };
    return null;
  }
  if (G.mode !== 'walk') return null;
  const L = canLaunch();
  if (L === 'sill' || L === 'garden') return { label: '✈️ Lancer l’avion en papier', act: launchPlane };
  if (L === 'closed') return { label: 'La fenêtre est fermée (ouverte de 9h à 19h)', act: () => {} };
  let best = null, bd = 1e9;
  const consider = (d, o) => { if (d < bd) { bd = d; best = o; } };
  if (Cat && Cat.state !== 'ridden') {
    const d = Math.hypot(Cat.x - P.x, Cat.z - P.z), dy = P.y - Cat.y;
    if (d < 26 && dy > -8 && dy < 30) {
      const s = INV.slots[G.sel], it = s && ITEMS[s.id];
      const lab = it && (it.type === 'food' || it.type === 'drink') ? `Donner ${it.name} à Moustache` : 'Caresser Moustache';
      consider(d - 10, { label: lab + (G.cat.aff >= CONFIG.cat.rideAff ? ' · <kbd>F</kbd> monter' : ` · 🐎 ${Math.floor(G.cat.aff)}/${CONFIG.cat.rideAff} pour monter`), act: petCat });
    }
  }
  const Cr = G.car;
  if (!carStowed() && Math.hypot(Cr.x - P.x, Cr.z - P.z) < 16 && Math.abs(Cr.y - P.y) < 6) consider(Math.hypot(Cr.x - P.x, Cr.z - P.z) + 4, { label: '🚗 Ranger la voiture dans l’inventaire · <kbd>F</kbd> monter', act: stowCar });
  const pk = nearestPickup(P.x, P.y, P.z, CONFIG.player.reach);
  if (pk) consider(Math.hypot(pk.x - P.x, pk.z - P.z), { label: `Ramasser ${ITEMS[pk.id].icon} ${ITEMS[pk.id].name}${pk.n > 1 ? ' ×' + pk.n : ''}`, act: () => collect(pk) });
  for (const o of staticInteracts()) {
    const d = Math.hypot(o.x - P.x, o.z - P.z), dy = P.y - o.y;
    if (d < o.r && dy > -8 && dy < (o.ymax || 10)) consider(d, o);
  }
  return best;
}
function collect(p) {
  const id = p.id, total = p.n;
  const left = INV.add(id, total);
  if (left === total) return toast('Inventaire plein !', 'warn');
  if (left) p.n = left; else removePickup(p);
  SFX.play('pickup'); Missions.event('pickup', { id, n: total - left });
  if (id === 'chips' && Dog.state === 'sleep') G.flags.chipsHeist = true;
  if (id === 'carte') G.minimap = true;
  if (id === 'pioche' || id === 'epee' || id === 'pomme_or') eggFound(id);
  UI.dirty = true;
}
function recallCar() {
  if (carStowed()) return toast('Ta voiture est rangée dans ton inventaire (🚗).', 'info');
  const C = G.car; Object.assign(C, { x: 950, y: 0.4, z: 16, vx: 0, vy: 0, vz: 0, heading: -Math.PI / 2, onGround: false });
  SFX.play('door'); toast('🅿️ Ta voiture est garée devant le trou de souris.', 'success');
}
function interact() { const it = findInteraction(); if (it) it.act(); }
function toggleVehicle() {
  if (G.mode === 'car') return exitCar();
  if (G.mode === 'cat') return endRide('Tu descends de Moustache.');
  if (G.mode !== 'walk') return;
  const P = G.p, C = G.car;
  if (!carStowed() && Math.hypot(C.x - P.x, C.z - P.z) < 16 && Math.abs(C.y - P.y) < 6) return enterCar();
  if (Cat && Cat.state !== 'ridden' && Math.hypot(Cat.x - P.x, Cat.z - P.z) < 26 && Math.abs(Cat.y - P.y) < 20) {
    if (G.cat.aff >= CONFIG.cat.rideAff) return startRide();
    return toast(`Moustache ne te connaît pas encore assez : ${Math.floor(G.cat.aff)}/${CONFIG.cat.rideAff} d’affection. Caresse-le (E) ou donne-lui à manger.`, 'info');
  }
  toast('Approche-toi de ta voiture pour monter dedans (F).', 'info', 2000);
}
