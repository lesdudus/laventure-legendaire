// ------------------------------ ÉTAT DU JEU, SAUVEGARDE, BOUCLE ------------------------------
const SAVE_KEY = 'minuscule_save_v1', CHECK_KEY = 'minuscule_checkpoint_v1', SET_KEY = 'minuscule_settings_v1';
const SETTINGS = Object.assign({ sens: 1, fov: 75, vol: 0.7, invY: false, style: 'pixel', buildMode: 'build', ghostBuild: 'cube', ghostExplore: 'aucun', exploreNoPlace: true, dogNight: false, catUnlimited: false, libAll: true, quality: 'auto', showFps: false }, (() => { try { return JSON.parse(localStorage.getItem(SET_KEY) || '{}'); } catch (e) { return {}; } })());
function saveSettings() { try { localStorage.setItem(SET_KEY, JSON.stringify(SETTINGS)); } catch (e) { /* stockage indisponible */ } }
const INV = new Inventory(CONFIG.invSize), CHEST = new Inventory(CONFIG.chestSize);
const ownCount = (k) => INV.count(k) + CHEST.count(k);
let RENDERER, SCENE, CAM, MARKER, CAR_BEACON, HEMI, SUN, NIGHT, PLAYER_MODEL, CAR_MODEL, PLANE_MODEL, JAR_MODEL, GATES = [];
const CUBES = [];
let G = { started: false, flags: {}, p: { x: 0, y: 0, z: 0 }, s: {}, cat: { aff: 0 }, simT: 0, hour: 9, daylight: 1, mode: 'walk', counters: {}, stats: {}, dayStats: {}, upgrades: {}, side: {}, visited: {}, daily: [], known: {}, look: {}, baseUp: {}, egg: { found: {} } };
const LOOK_COLORS = {
  cap: [0xb11f4b, 0x1565c0, 0x2e7d32, 0xf9a825, 0x212121, 0x6a1b9a, 0xef6c00, 0xfafafa],
  hood: [0xd84315, 0x1e88e5, 0x43a047, 0xfdd835, 0x424242, 0x8e24aa, 0x00897b, 0xeceff1],
  pants: [0x37474f, 0x1a237e, 0x4e342e, 0x263238, 0x5d4037, 0x2e7d32, 0x880e4f, 0x9e9e9e],
};

// ------------------------------ PERSISTANCE : base de données du navigateur (IndexedDB) ------------------------------
// Les sauvegardes survivent aux mises à jour du fichier ; localStorage sert de copie de secours.
const DB = {
  db: null, cache: {},
  init() {
    for (const k of [SAVE_KEY, CHECK_KEY]) { try { const s = localStorage.getItem(k); if (s) this.cache[k] = JSON.parse(s); } catch (e) { /* ignoré */ } }
    return new Promise((resolve) => {
      let done = false; const finish = () => { if (!done) { done = true; resolve(); } };
      setTimeout(finish, 2500);
      try {
        const req = indexedDB.open('minuscule', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('kv');
        req.onerror = finish;
        req.onsuccess = () => {
          this.db = req.result;
          const tx = this.db.transaction('kv', 'readonly'), st = tx.objectStore('kv');
          for (const k of [SAVE_KEY, CHECK_KEY]) {
            const g = st.get(k);
            g.onsuccess = () => { const v = g.result; if (v && (!this.cache[k] || (v.savedAt || 0) >= (this.cache[k].savedAt || 0))) this.cache[k] = v; };
          }
          tx.oncomplete = () => { for (const k of [SAVE_KEY, CHECK_KEY]) if (this.cache[k]) this.put(k, this.cache[k]); finish(); };
          tx.onerror = finish;
        };
      } catch (e) { finish(); }
    });
  },
  put(k, v) { try { if (this.db) this.db.transaction('kv', 'readwrite').objectStore('kv').put(v, k); } catch (e) { /* ignoré */ } },
  get(k) { return this.cache[k] || null; },
  set(k, v) { this.cache[k] = v; this.put(k, v); try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* plein */ } },
};

function body(x, y, z, r, h, step) { return { x, y, z, vx: 0, vy: 0, vz: 0, r, h, step, onGround: false }; }
function freshState() {
  const b = W.base.spawn;
  return {
    started: true, mode: 'walk', time: (CONFIG.startDay - 1) * 1440 + CONFIG.startHour * 60, day: CONFIG.startDay, hour: CONFIG.startHour, simT: 0, daylight: 1,
    s: { vie: 100, nour: 70, energie: 85 },
    p: body(b.x, b.y, b.z, CONFIG.player.radius, CONFIG.player.height, CONFIG.player.step),
    yaw: Math.PI, pitch: -0.05, cam3: true, crouch: false, sel: 0,
    car: Object.assign(body(935, 0.4, 15, CONFIG.car.radius, 5.2, CONFIG.car.step), { heading: Math.PI / 2, launch: 1.8 }),
    cat: { aff: 0, petT: 0, ride: CONFIG.cat.rideTime }, flags: {}, side: {}, mainStep: 0, track: null, daily: [], dayEaten: {}, counters: {},
    stats: { spotted: 0, captures: 0 }, dayStats: {}, stars: 0, upgrades: {}, visited: {}, base2: null, capturesToday: 0, mood: 0,
    fx: { crash: 0, hicUntil: 0, hicNext: 0, feastUntil: 0 }, rest: null, noiseLevel: 0, noiseShown: 0, alertState: 0, hideHere: 0, prompt: '', minimap: false,
    race: null, jar: null, flight: null, ride: null, shake: 0, lastDay: CONFIG.startDay, pvis: {},
    breath: { v: 100, out: false, wait: 0, fullT: -99 },
    egg: { found: {}, cake: 6, cakeDay: 0, tntDay: 0, oreDay: 0, grassDay: 0, endSpot: 0 }, fuse: 0,
    known: {}, unlockedSeen: {}, look: { cap: LOOK_COLORS.cap[0], hood: LOOK_COLORS.hood[0], pants: LOOK_COLORS.pants[0] },
    armor: { on: false, dur: 0 }, invis: { on: false, charge: 0 }, baseUp: {}, ev: null,
  };
}
function saveGame(key = SAVE_KEY) {
  if (!G.started || G.mode === 'dead') return;
  const P = G.p, C = G.car;
  const d = {
    v: 2, savedAt: Date.now(), time: G.time, s: G.s, fx: { feastUntil: G.fx.feastUntil || 0 }, p: [P.x, P.y, P.z], yaw: G.yaw, pitch: G.pitch, cam3: G.cam3,
    car: [C.x, C.y, C.z, C.heading], cat: { aff: G.cat.aff }, flags: G.flags, side: G.side, mainStep: G.mainStep, track: G.track,
    daily: G.daily, dayEaten: G.dayEaten, counters: G.counters, stats: G.stats, stars: G.stars, upgrades: G.upgrades, visited: G.visited,
    base2: G.base2, capturesToday: G.capturesToday, mood: G.mood, lastDay: G.lastDay, minimap: G.minimap, sel: G.sel,
    inv: INV.slots, chest: CHEST.slots, egg: G.egg, invis: { on: false, charge: G.invis.charge }, cubes: CUBES.map((c) => [c.x, c.y, c.z, c.v]),
    known: G.known, unlockedSeen: G.unlockedSeen, look: G.look, armor: G.armor, baseUp: G.baseUp, ev: G.ev,
    spawns: Object.fromEntries(SPAWNS.map((s) => [spawnKey(s), [s.next, s.done ? 1 : 0, s.pk ? 1 : 0]])),
    drops: PICKUPS.filter((p) => !p.spawn && p.landed).map((p) => [p.id, p.n, p.x, p.y, p.z]),
  };
  DB.set(key, JSON.parse(JSON.stringify(d)));
}
function loadSave(key) { return DB.get(key); }
// Anciennes sauvegardes : faim + soif → Nourriture (moyenne)
function migrateStats(s) {
  const o = { vie: 100, nour: 70, energie: 85 };
  if (!s) return o;
  o.vie = s.vie ?? 100; o.energie = s.energie ?? 85;
  o.nour = s.nour ?? ((s.faim ?? 70) + (s.soif ?? 70)) / 2;
  return o;
}

function resetDynamic() {
  for (const p of PICKUPS.slice()) { W.scene.remove(p.mesh); }
  PICKUPS.length = 0;
  for (const s of SPAWNS) { s.pk = null; s.next = 0; s.done = false; }
  for (const c of CUBES.slice()) removeCube(c, false);
  if (G.base2Mesh) { W.scene.remove(G.base2Mesh); G.base2Mesh = null; }
  if (typeof resetEvents === 'function') resetEvents();
}

function startGame(data) {
  resetDynamic();
  onOwned = null;
  G = freshState();
  INV.slots.fill(null); CHEST.slots.fill(null);
  if (data) {
    Object.assign(G, {
      time: data.time, s: migrateStats(data.s), yaw: Math.PI, pitch: -0.05, cam3: data.cam3 ?? true, flags: data.flags || {}, side: data.side || {}, mainStep: data.mainStep || 0,
      track: data.track || null, daily: data.daily || [], dayEaten: data.dayEaten || {}, counters: data.counters || {}, stats: data.stats || G.stats, stars: data.stars || 0,
      upgrades: data.upgrades || {}, visited: data.visited || {}, base2: data.base2 || null, capturesToday: data.capturesToday || 0, mood: data.mood || 0,
      lastDay: data.lastDay || 1, minimap: !!data.minimap, sel: data.sel || 0,
      known: data.known || {}, unlockedSeen: data.unlockedSeen || {}, look: Object.assign(G.look, data.look || {}), armor: data.armor || G.armor, baseUp: data.baseUp || {}, ev: data.ev || null,
    });
    G.cat.aff = data.cat ? data.cat.aff : 0;
    if (data.fx) G.fx.feastUntil = data.fx.feastUntil || 0;
    // au lancement, on se réveille toujours dans sa base
    G.car.x = data.car[0]; G.car.y = data.car[1]; G.car.z = data.car[2]; G.car.heading = data.car[3];
    INV.load(data.inv); CHEST.load(data.chest);
    if (data.invis) G.invis.charge = data.invis.charge || 0;
    // ancien coffre de voiture (supprimé) : son contenu va dans le coffre de la base, le surplus au sol dans la base
    for (const s of data.trunk || []) if (s && ITEMS[s.id]) { const left = CHEST.add(s.id, s.n); if (left) spawnPickup(s.id, left, 930 + rand(-6, 6), 0, -40 + rand(-6, 6)); }
    if (data.egg) Object.assign(G.egg, data.egg);
    const sv = data.spawns || {};
    // objets déplacés depuis (meuble TV décalé) : on retrouve leur ancien état
    if (!Array.isArray(sv)) for (const [oldK, newK] of [['pile@260,452', 'pile@310,452']]) if (sv[oldK] && !sv[newK]) sv[newK] = sv[oldK];
    if (Array.isArray(sv)) { if (sv.length === SPAWNS.length) sv.forEach((v, i) => { const s = SPAWNS[i]; s.next = v[0]; s.done = !!v[1]; if (v[2]) spawnPickup(s.id, s.n, s.x, s.y, s.z, s); }); else for (const s of SPAWNS) spawnPickup(s.id, s.n, s.x, s.y, s.z, s); }
    else for (const s of SPAWNS) { const v = sv[spawnKey(s)]; if (!v) { if (!s.win) spawnPickup(s.id, s.n, s.x, s.y, s.z, s); continue; } s.next = v[0]; s.done = !!v[1]; if (v[2]) spawnPickup(s.id, s.n, s.x, s.y, s.z, s); }
    for (const d of data.drops || []) if (ITEMS[d[0]]) spawnPickup(d[0], d[1], d[2], d[3], d[4]);
    snapSavedCubes(data.cubes || []);
    if (G.base2) placeBase2Mesh();
    for (const inv of [INV, CHEST]) for (const s of inv.slots) if (s) G.known[s.id] = 1;
    for (const r of RECIPES) if (recipeUnlocked(r)) G.unlockedSeen[recipeKey(r)] = 1;
  } else {
    INV.add('miette', 2); INV.add('rosee', 1); INV.add('tenue_invis', 1);
    CHEST.add('eau_bouchon', 1); CHEST.add('cube', 4); CHEST.add('croquette', 1);
    for (const inv of [INV, CHEST]) for (const s of inv.slots) if (s) G.known[s.id] = 1;
    for (const r of RECIPES) if (recipeUnlocked(r)) G.unlockedSeen[recipeKey(r)] = 1;
    Missions.newDay();
  }
  if (!ownCount('tenue_invis') && INV.add('tenue_invis', 1)) CHEST.add('tenue_invis', 1);
  onOwned = noteOwned;
  G.day = Math.floor(G.time / 1440) + 1; G.hour = (G.time % 1440) / 60; G.daylight = daylightAt(G.hour);
  if (G.flags.colony && !W.plug.solid.off) { removeSolid(W.plug.solid); W.plug.mesh.visible = false; }
  else if (!G.flags.colony && W.plug.solid.off) { W.plug.solid.off = false; hashOp(W.plug.solid, true); W.plug.mesh.visible = true; }
  if (G.minimap || INV.count('carte') || CHEST.count('carte')) G.minimap = true;
  for (const h of HUMANS) { h.state = 'routine'; h.sus = 0; h.mem = 0; h.awakeT = 0; h.distractT = 0; h.setActivity(schedAt(h.id, G.hour), true); }
  Dog.state = dogSchedAt(G.hour); if (Dog.state === 'sleep') { Dog.x = 720; Dog.z = 800; } else { const s = pick(W.dogSpots); Dog.x = s.x; Dog.z = s.z; }
  Dog.path = null; Dog.target = null;
  Cat.state = 'nap'; Cat.timer = 30; Cat.jump = null; Cat.spot = W.catSpots[0]; Cat.x = 590; Cat.z = 500; Cat.y = 3; Cat.path = null;
  Scent.wash(); G.p.onGround = false; G.car.onGround = false;
  updateSpawns();
  refreshBase(); refreshCastle(); refreshPlayerModel(); startEventsForDay(false); fixCarState();
  if (!data) spawnCrystal();
  UI.mmBg = null; UI.hudCache = {}; UI.dirty = true; UI.pick = -1;
  JAR_MODEL.visible = false; PLANE_MODEL.visible = false; for (const g of GATES) g.visible = false;
  placeEnder(G.egg.endSpot || 0); EGGS.cake.shown = -1;
  for (const c of CONFETTI) SCENE.remove(c.m); CONFETTI.length = 0;
  $('jar').classList.add('hidden'); $('restbar').classList.add('hidden'); $('racehud').classList.add('hidden');
  $('hud').classList.remove('hidden');
  UI.close(false);
  SFX.init();
  G.freeMouse = FREE_MOUSE;
  tryLock();
  saveGame(CHECK_KEY);
  if (!data) setTimeout(() => toast('Bienvenue, minuscule ! Tu te réveilles dans ta base : un trou de souris caché derrière le bureau. Marc travaille juste devant… sois discret.', 'info'), 400);
  else setTimeout(() => toast(`De retour dans ta base. Jour ${G.day}, ${fmtClock(G.time % 1440)}. Ton inventaire t’attendait.`, 'info'), 400);
}
// Objets possédés au moins une fois → déblocage des recettes
function noteOwned(id) {
  if (!G.started || G.known[id]) return;
  G.known[id] = 1;
  for (const r of RECIPES) {
    const k = recipeKey(r);
    if (G.unlockedSeen[k] || !recipeUnlocked(r)) continue;
    G.unlockedSeen[k] = 1;
    const info = recipeInfo(r);
    toast(`📜 Nouvelle recette : ${info.icon} ${info.name} — ${({ main: 'dans l’inventaire (I)', bbq: 'au barbecue du jardin' })[recipeWhere(r)] || 'à l’établi'}`, 'success');
  }
}
function refreshPlayerModel() {
  const old = PLAYER_MODEL, parent = old ? old.parent : SCENE;
  const m = makePlayerModel({ cap: G.look.cap, hood: G.look.hood, pants: G.look.pants });
  if (old) { m.position.copy(old.position); m.rotation.copy(old.rotation); m.scale.copy(old.scale); m.visible = old.visible; if (parent) parent.remove(old); }
  (parent || SCENE).add(m); PLAYER_MODEL = m;
  if (G.mode === 'car') enterCarVisual();
}

// ------------------------------ RENDU & LUMIÈRE ------------------------------
// Qualité graphique : « auto » ajuste la résolution interne selon la fluidité mesurée
const RES = { cur: 1, slow: 0, fast: 0, frames: 0, fpsT: 0, fps: 0 };
function qualityRange() {
  const hi = Math.min(devicePixelRatio, 1.5), lo = Math.min(devicePixelRatio, 1);
  if (SETTINGS.quality === 'haute') return { min: hi, max: hi };
  if (SETTINGS.quality === 'economie') return { min: Math.min(lo, 0.85), max: Math.min(lo, 0.85) };
  return { min: lo, max: hi };
}
function setRenderScale(v) {
  if (Math.abs(v - RENDERER.getPixelRatio()) < 0.01) return;
  RES.cur = v; RENDERER.setPixelRatio(v); RENDERER.setSize(innerWidth, innerHeight);
}
function applyQuality() { const q = qualityRange(); setRenderScale(SETTINGS.quality === 'auto' ? clamp(RES.cur, q.min, q.max) : q.max); RES.slow = RES.fast = 0; }
// Images en retard pendant ~1,5 s → résolution −0,25 ; fluide pendant ~8 s → +0,25
function adaptResolution(dt) {
  const q = qualityRange(); if (q.min === q.max) return;
  if (dt > 0.022) RES.slow += dt; else RES.slow = Math.max(0, RES.slow - dt * 0.5);
  if (dt < 0.0185) RES.fast += dt; else RES.fast = 0;
  if (RES.slow > 1.5 && RES.cur > q.min + 0.01) { setRenderScale(Math.max(q.min, RES.cur - 0.25)); RES.slow = RES.fast = 0; }
  else if (RES.fast > 8 && RES.cur < q.max - 0.01) { setRenderScale(Math.min(q.max, RES.cur + 0.25)); RES.slow = RES.fast = 0; }
}
function initRender() {
  RENDERER = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, logarithmicDepthBuffer: true });
  RES.cur = qualityRange().max;
  RENDERER.setPixelRatio(RES.cur);
  RENDERER.setSize(innerWidth, innerHeight);
  SCENE = new THREE.Scene();
  SCENE.background = new THREE.Color(0x9fd3ff);
  SCENE.fog = new THREE.Fog(0x9fd3ff, 2200, 6000);
  CAM = new THREE.PerspectiveCamera(SETTINGS.fov, innerWidth / innerHeight, 0.25, 9000);
  CAM.rotation.order = 'YXZ';
  HEMI = new THREE.HemisphereLight(0xffffff, 0x8a7a66, 2.2); SCENE.add(HEMI);
  SUN = new THREE.DirectionalLight(0xfff1d6, 1.6); SUN.position.set(-500, 900, 1600); SUN.target.position.set(600, 0, 700); SCENE.add(SUN, SUN.target);
  NIGHT = new THREE.AmbientLight(0x5a6aa0, 0); SCENE.add(NIGHT);
  addEventListener('resize', () => { RENDERER.setSize(innerWidth, innerHeight); CAM.aspect = innerWidth / innerHeight; CAM.updateProjectionMatrix(); });
}
const _cNight = new THREE.Color(0x0b1026), _cDay = new THREE.Color(0x9fd3ff), _cDusk = new THREE.Color(0xf4a261);
function updateLighting(dt) {
  const d = G.daylight, h = G.hour;
  const dusk = (h > 4.5 && h < 9) || (h > 17.5 && h < 22.5) ? Math.max(0, 1 - Math.abs(d - 0.5) * 2) : 0;
  SCENE.background.copy(_cNight).lerp(_cDay, d).lerp(_cDusk, dusk * 0.55);
  SCENE.fog.color.copy(SCENE.background);
  HEMI.intensity = 0.5 + 1.8 * d; SUN.intensity = 0.1 + 1.5 * d; NIGHT.intensity = (1 - d) * 1.1;
  SUN.color.setHex(dusk > 0.3 ? 0xffc48a : 0xfff1d6);
  for (const l of W.lamps) {
    let want = false;
    if (d < 0.6) for (const hm of HUMANS) { if (hm.away || hm.asleep) continue; const r = roomAt(hm.x, hm.z); if (r && r.id === l.room) want = true; }
    if (l.id === 'salon' && d < 0.6 && HUMANS.some((hm) => hm.act === 'm_tv' && !hm.asleep)) want = true;
    l.level = clamp(l.level + (want ? dt : -dt) * 1.5, 0, 1);
    l.light.intensity = l.level * 2.4;
    l.mat.color.setHex(l.level > 0.5 ? 0xfff2c4 : 0x9a8d74);
  }
  const tvOn = HUMANS.some((hm) => hm.act === 'm_tv' && hm.pose === 'sit');
  if (tvOn) { W.tv.t -= dt; if (W.tv.t <= 0) { W.tv.t = rand(0.15, 0.6); W.tv.mat.color.setHSL(0.55 + rand(-0.08, 0.08), 0.5, rand(0.45, 0.75)); } }
  else W.tv.mat.color.setHex(0x0b0b0e);
  // fenêtre du salon : ouverte de 9h à 19h
  const open = h >= 9 && h < 19;
  if (open !== W.pane.open) {
    W.pane.open = open;
    if (open) removeSolid(W.pane.solid); else { W.pane.solid.off = false; hashOp(W.pane.solid, true); }
    W.pane.mesh.position.set(open ? -145 : 0, 0, open ? -2.5 : 0); W.pane.fr.position.copy(W.pane.mesh.position);
  }
}
function updateDoor(dt) {
  const D = W.door;
  let near = false;
  for (const h of HUMANS) if (!h.away && !h.asleep && dist2(h.x, h.z, 1045, 856) < 160) near = true;
  if (near) D.timer = 2.5; else D.timer -= dt;
  const tgt = D.timer > 0 ? 1 : 0;
  if (tgt !== D.target) { D.target = tgt; SFX.at('door', 1045, 100, 856, 900, 0.8); }
  D.open = clamp(D.open + (tgt ? 1 : -1) * dt * 1.6, 0, 1);
  D.group.rotation.y = D.open * 1.65;
  const solidOn = D.open < 0.1;
  for (const s of D.solids) { if (solidOn && s.off) { s.off = false; hashOp(s, true); } else if (!solidOn && !s.off) removeSolid(s); }
  const fs = D.flapSolid, flapOn = solidOn && !G.flags.chatiere;
  if (flapOn && fs.off) { fs.off = false; hashOp(fs, true); } else if (!flapOn && !fs.off) removeSolid(fs);
  const flapNear = (dist2(G.p.x, G.p.z, 1045, 854) < 14 && G.flags.chatiere) || (Cat && dist2(Cat.x, Cat.z, 1045, 854) < 25);
  D.flapAng = lerp(D.flapAng, flapNear ? 1.2 * Math.sign((G.p.z - 854) || 1) : 0, Math.min(1, dt * 6));
  D.flapPivot.rotation.x = -D.flapAng;
}

// ------------------------------ CAMÉRA ------------------------------
const _fwd = new THREE.Vector3();
function camForward() { return _fwd.set(-Math.sin(G.yaw) * Math.cos(G.pitch), Math.sin(G.pitch), -Math.cos(G.yaw) * Math.cos(G.pitch)); }
function placeChase(tx, ty, tz, dist, up) {
  const f = camForward();
  const dx = -f.x, dy = -f.y, dz = -f.z;
  let dd = dist;
  const hit = raycast(tx, ty, tz, dx, dy, dz, dist + 1, (s) => s.tag !== 'glass' && s.tag !== 'cube');
  if (hit) dd = Math.max(1.2, hit.t - 1);
  CAM.position.set(tx + dx * dd, ty + dy * dd + up, tz + dz * dd);
  // le plafond de la maison (250 cm) n'est pas solide : la caméra reste dessous
  if (ty < 250 && CAM.position.y > 247 && CAM.position.x > -12 && CAM.position.x < 1212 && CAM.position.z > -12 && CAM.position.z < 862) CAM.position.y = 247;
  CAM.lookAt(tx, ty + up * 0.3, tz);
}
function updateCamera(dt) {
  const P = G.p;
  G.shake = Math.max(0, G.shake - dt * 2.5);
  const sh = G.shake * 0.6;
  if (G.mode === 'jar') {
    const j = W.spots.jar, a = G.simT * 0.3;
    CAM.position.set(j.x + 30 + Math.sin(a) * 6, j.y + 14, j.z + Math.cos(a) * 30);
    CAM.lookAt(j.x, j.y + 6, j.z);
  } else if (G.mode === 'flight') {
    const F = G.flight;
    CAM.position.set(F.x - Math.sin(F.yaw) * 30, F.y + 9, F.z - Math.cos(F.yaw) * 30);
    CAM.lookAt(F.x + Math.sin(F.yaw) * 20, F.y + Math.sin(F.pitch) * 20, F.z + Math.cos(F.yaw) * 20);
  } else if (G.mode === 'car') {
    if (G.cam3) placeChase(P.x, P.y + 4, P.z, 30, 6);
    else { CAM.position.set(P.x, P.y + 4.3, P.z); CAM.rotation.set(G.pitch, G.yaw, 0); }
  } else if (G.mode === 'cat') {
    if (G.cam3) placeChase(P.x, P.y + 6, P.z, 60, 12);
    else { CAM.position.set(P.x, P.y + 7, P.z); CAM.rotation.set(G.pitch, G.yaw, 0); }
  } else {
    const eye = G.crouch ? CONFIG.player.crouchEye : CONFIG.player.eye;
    if (G.cam3) placeChase(P.x, P.y + eye - 0.6, P.z, 18, 2.5);
    else { CAM.position.set(P.x, P.y + eye, P.z); CAM.rotation.set(G.pitch, G.yaw, 0); }
  }
  if (sh > 0) { CAM.position.x += rand(-sh, sh); CAM.position.y += rand(-sh, sh); }
  SFX.listener = { x: P.x, y: P.y, z: P.z };
}

// ------------------------------ BOUCLE PRINCIPALE ------------------------------
let _last = performance.now(), _lastRender = 0, _saveT = 0, _tick = 0, _spawnT = 0;
const PERF = { step: 0, hud: 0, render: 0, n: 0 };
const PAUSE_PANELS = ['pause', 'options', 'keys', 'title', 'over', 'win'];
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - _last) / 1000); _last = now;
  const t0 = performance.now();
  if (G.started) {
    const paused = PAUSE_PANELS.includes(UI.panel) || (!UI.panel && !Input.locked && !G.freeMouse) || G.mode === 'dead';
    if (!paused) step(dt);
    else Input.take();
    PERF.step += performance.now() - t0;
    const t1 = performance.now();
    $('crosshair').style.display = G.mode === 'walk' || G.mode === 'cat' ? '' : 'none';
    if (!UI.panel && !Input.locked && !G.freeMouse && G.mode !== 'dead') G.prompt = '<b>Clique pour reprendre</b>';
    updateCamera(dt);
    UI.hud();
    PERF.hud += performance.now() - t1;
  } else {
    const a = now / 9000;
    CAM.position.set(330 + Math.sin(a) * 120, 22, 640 + Math.cos(a) * 120); CAM.lookAt(285, 30, 640);
  }
  // économies : écran titre et menus de pause → 15 images/s ; fenêtre inactive → 5 images/s
  const focus = document.hasFocus(), idle = !G.started || PAUSE_PANELS.includes(UI.panel);
  const gap = !focus ? 200 : idle ? 66 : 0;
  if (gap && now - _lastRender < gap) return;
  if (G.started && !idle && focus && _lastRender) adaptResolution(Math.min(0.05, (now - _lastRender) / 1000));
  _lastRender = now;
  RES.frames++;
  if (now - RES.fpsT > 500) { RES.fps = Math.round((RES.frames * 1000) / (now - RES.fpsT)); RES.frames = 0; RES.fpsT = now; if (SETTINGS.showFps) $('fps').textContent = `${RES.fps} img/s · ${Math.round(RES.cur * 100)} %`; }
  const t2 = performance.now();
  styleFrame();
  RENDERER.render(SCENE, CAM);
  PERF.render += performance.now() - t2; PERF.n++;
}
function step(dt) {
  const m = Input.take(), sens = 0.0022 * SETTINGS.sens;
  if (G.mode !== 'jar') {
    G.yaw -= m.dx * sens; G.pitch -= m.dy * sens * (SETTINGS.invY ? -1 : 1);
    G.pitch = clamp(G.pitch, -1.45, 1.45);
  }
  const accel = G.rest ? (G.rest.sleep ? CONFIG.rest.sleepAccel : CONFIG.rest.restAccel) : 1;
  updatePlayer(dt);
  const total = dt * accel, n = Math.max(1, Math.ceil(total / 0.1)), sd = total / n;
  for (let i = 0; i < n; i++) simStep(sd);
  updateDoor(dt); updateLighting(dt); updatePickups(dt); updateAnts(dt); updateEggs(dt); updateEvents(dt); updateBaseFx(dt); updateCastle(dt); updateBarbecue(dt); updateInvisFx(); updateCubeGhost();
  _tick += dt;
  if (_tick > 0.25) { _tick = 0; perceptionTick(); Missions.tick(); }
  _saveT += dt; if (_saveT > 60) { _saveT = 0; saveGame(); }
  G.noiseShown = Math.max(G.noiseLevel, G.noiseShown - dt * 0.8); G.noiseLevel = 0;
}
function simStep(sd) {
  const prevDay = G.day;
  G.simT += sd;
  G.time += sd * CONFIG.timeScale / 60;
  G.day = Math.floor(G.time / 1440) + 1; G.hour = (G.time % 1440) / 60; G.daylight = daylightAt(G.hour);
  if (G.hour >= 6 && G.lastDay !== G.day) newDayMorning();
  if (G.day !== prevDay) G.mood = 0;
  for (const h of HUMANS) h.update(sd);
  Dog.update(sd); Cat.update(sd); Fish.update(sd);
  Scent.prune(G.simT);
  _spawnT += sd; if (_spawnT > 1) { _spawnT = 0; updateSpawns(); }
  survival(sd); invisTick(sd);
  if (G.rest) restTick(sd);
}
function newDayMorning() {
  G.lastDay = G.day; G.capturesToday = 0; Missions.newDay();
  toast(`☀️ Jour ${G.day} — nouveaux défis disponibles dans le journal (M).`, 'info');
  const B = G.baseUp || {};
  if (B.garde_manger) { const opts = ['miette', 'fromage', 'cereale', 'raisin', 'graine', 'pois', 'myrtille']; CHEST.add(pick(opts), 1); CHEST.add(pick(opts), 1); }
  if (B.recuperateur) CHEST.add('robinet', 2);
  if (B.garde_manger || B.recuperateur) toast('🥫 Ta base a produit des provisions : elles t’attendent dans le coffre.', 'success');
  startEventsForDay(true);
  if (spawnCrystal()) toast('🔮 Un Cristal d’ombre brille quelque part dans la maison…', 'info');
  saveGame(CHECK_KEY);
}
function updateBaseFx(dt) {
  const T = W.base.torch, f = 0.85 + Math.sin(G.simT * 13) * 0.08 + Math.sin(G.simT * 31) * 0.06;
  T.light.intensity = 1.5 * f; T.flame.scale.set(1, f, 1);
  if (G.armor && G.armor.on && !INV.count('armure')) G.armor.on = false;
  if (PLAYER_MODEL && PLAYER_MODEL.userData.armor) PLAYER_MODEL.userData.armor.visible = !!(G.armor && G.armor.on);
  if (CAR_MODEL) CAR_MODEL.userData.wings.visible = !!G.upgrades.ailerons;
}
function updateAnts(dt) {
  for (const a of W.ants) {
    a.t = (a.t + dt * 0.04) % 1;
    const ang = a.t * Math.PI * 2, x = 250 + Math.cos(ang) * 48, z = 1510 + Math.sin(ang) * 40;
    a.mesh.position.set(x, groundAt(x, z, 0.3, 30), z); a.mesh.rotation.y = -ang;
  }
}
