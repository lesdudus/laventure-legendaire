// ------------------------------ SYSTÈMES : SURVIE, REPOS, CAPTURE, BOCAL, COURSE, VICTOIRE ------------------------------
function survival(sd) {
  const S = G.s, C = CONFIG.stats, gh = (sd * CONFIG.timeScale) / 3600, P = G.p;
  // le Festin du barbecue garde la Nourriture à 100 % pendant 1 jour de jeu
  if ((G.fx.feastUntil || 0) > G.time) S.nour = 100;
  else S.nour = Math.max(0, S.nour - C.foodPerHour * gh);
  if (!G.rest) S.energie = Math.max(0, S.energie - C.energyPerHour * gh);
  if (S.energie <= 2 && !G.rest && (G.mode === 'walk' || G.mode === 'car' || G.mode === 'cat') && !G.race) {
    if (G.mode === 'car') exitCar(); else if (G.mode === 'cat') endRide();
    if (G.mode === 'walk') { startRest(false, true); toast('😵 À bout de forces, tu t’effondres sur place… Repos forcé jusqu’à 25 % d’énergie.', 'danger'); }
  }
  if (S.nour <= 0) S.vie -= (C.starve + C.dehydrate) * sd;
  if (S.nour > 50 && S.vie < 100) S.vie = Math.min(100, S.vie + C.regen * sd);
  if (G.fx.crash && G.simT >= G.fx.crash) { G.fx.crash = 0; S.energie = Math.max(0, S.energie - 15); toast('Coup de fatigue après le sucre… (-15 énergie)', 'warn'); }
  if (G.fx.hicUntil > G.simT && G.simT >= G.fx.hicNext) { G.fx.hicNext = G.simT + rand(4, 7); SFX.play('hic'); emitNoise(G.p.x, G.p.y, G.p.z, 240, 0.5, 'hoquet'); toast('Hic !', 'warn', 1200); }
  G.warned = G.warned || {};
  for (const [k, msg] of [['nour', '🍽️ Ta Nourriture est presque vide : mange ou bois vite quelque chose !'], ['energie', 'Tu es épuisé : tu avances au ralenti. Repose-toi (T) avant de t’effondrer !']]) {
    if (S[k] < C.low && !G.warned[k]) { G.warned[k] = 1; toast(msg, 'warn'); }
    if (S[k] > C.low + 10) G.warned[k] = 0;
  }
  if (S.vie <= 0 && G.mode !== 'dead') { S.vie = 0; gameOver('Tu t’es évanoui…', S.nour <= 0 ? 'Tu n’avais plus rien mangé ni bu. Léa t’a trouvé inconscient et t’a installé dans sa maison de poupée… pour toujours.' : 'Tes forces t’ont lâché. Léa t’a trouvé inconscient et t’a installé dans sa maison de poupée… pour toujours.'); }
}

// ---------- repos & sommeil ----------
function nearBed() {
  const P = G.p;
  if (dist2(P.x, P.z, W.base.bed.x, W.base.bed.z) < 20 && P.y < 8) return 'base';
  if (dist2(P.x, P.z, EGGS.bed.x, EGGS.bed.z) < 18 && P.y < 6) return 'jouet';
  if (G.base2 && dist2(P.x, P.z, G.base2.x, G.base2.z) < 18 && Math.abs(P.y - G.base2.y) < 6) return 'base2';
  if (G.flags.colony && inRect(P.x, P.z, W.zones.shedInside) && P.y < 20) return 'colonie';
  return null;
}
const factorHour = (h) => (h >= 20 || h < 8 ? 0.25 : h < 9.25 ? 1 : h < 16 ? 0.6 : 1);
function riskPerHour(score) { return clamp(((100 - score) / 100) * factorHour(G.hour) * CONFIG.capture.baseRisk * (G.mood ? 0.7 : 1), 0, 1); }
function humanActivityLabel() { const f = factorHour(G.hour); return f >= 1 ? 'très actifs en ce moment' : f >= 0.6 ? 'assez actifs' : 'presque tous endormis'; }
function startRest(sleep, forced = false) {
  if (G.mode !== 'walk') return toast('Descends d’abord de ton véhicule.', 'warn');
  if (isInvisible()) { G.invis.on = false; toast('🫥 La tenue s’éteint pendant le repos.', 'info'); refreshEquip(); }
  if (sleep && !nearBed()) return;
  const fur = inCatFur(G.p.x, G.p.y, G.p.z);
  G.rest = { sleep, forced, fur, score: hideScore(G.p.x, G.p.y, G.p.z) };
  G.p.vx = G.p.vz = 0;
  $('restbar').classList.remove('hidden');
  toast(sleep ? 'Tu t’endors… (T pour te réveiller)' : 'Tu te reposes… (T pour te relever)', 'info', 2500);
}
function stopRest(msg, kind = 'info') {
  const wasSleep = G.rest && G.rest.sleep;
  G.rest = null; $('restbar').classList.add('hidden');
  if (msg) toast(msg, kind);
  if (wasSleep && G.mode === 'walk') saveGame(CHECK_KEY);
  saveGame();
}
function restTick(sd) {
  const R = G.rest, S = G.s, gh = (sd * CONFIG.timeScale) / 3600;
  const bonus = G.baseUp.tapis && inBaseArea(G.p.x, G.p.y, G.p.z) ? 1.4 : 1;
  S.energie = Math.min(100, S.energie + (R.sleep ? CONFIG.rest.sleepGain : CONFIG.rest.restGain) * bonus * gh);
  if (R.fur && !inCatFur(G.p.x, G.p.y, G.p.z)) return stopRest('Moustache s’est levée : tu n’es plus caché dans sa fourrure !', 'warn');
  const p = riskPerHour(R.score);
  if (p > 0 && Math.random() < 1 - Math.pow(1 - p, gh)) { stopRest(); onCaptured(null, 'sleep'); return; }
  if (R.forced) { if (S.energie >= 25) stopRest('Tu as repris un peu de forces. Trouve vite de quoi te reposer vraiment.', 'info'); return; }
  for (const h of HUMANS) if ((h.state === 'investigate' || h.state === 'chase' || h.state === 'search') && dist2(h.x, h.z, G.p.x, G.p.z) < 450) return stopRest('⚠️ Un humain approche : tu te réveilles en sursaut !', 'danger');
  if (['chase', 'track', 'alert', 'bark'].includes(Dog.state) && dist2(Dog.x, Dog.z, G.p.x, G.p.z) < 260) return stopRest('⚠️ Rex rôde tout près : tu te réveilles !', 'danger');
  if (!R.forced && S.nour <= 3) return stopRest('Ton ventre gargouille : impossible de dormir.', 'warn');
  if (S.energie >= 100) stopRest(R.sleep ? 'Tu te réveilles en pleine forme !' : 'Tu es reposé.', 'success');
}

// ---------- capture & bocal ----------
function onCaptured(h, how) {
  if (G.mode === 'jar' || G.mode === 'dead') return;
  G.capturesToday++; G.stats.captures++;
  if (UI.panel && !PAUSE_PANELS.includes(UI.panel)) UI.close(false);
  SFX.play('capture');
  if (G.rest) { G.rest = null; $('restbar').classList.add('hidden'); }
  if (G.mode === 'car') { SFX.engine(false, 0); leaveVehicleVisual(); }
  if (G.mode === 'cat') endRide();
  if (G.race) endRace(false, 'Course interrompue.');
  const awake = HUMANS.filter((x) => !x.away);
  const who = h ? h.name : (awake.length ? pick(awake).name : 'Marc');
  if (G.capturesToday >= CONFIG.capture.maxPerDay) {
    gameOver('Capturé trois fois !', `${who} t’a attrapé pour la troisième fois aujourd’hui. Cette fois, le bocal est fermé à double tour… Léa t’a installé dans sa maison de poupée pour toujours.`);
    return;
  }
  for (const x of HUMANS) { x.backToRoutine(); x.sus = 0; }
  if (['chase', 'bark', 'track'].includes(Dog.state)) { Dog.state = 'idle'; Dog.path = null; }
  G.time += 20;
  G.mode = 'jar'; G.jar = { meter: 0, last: null, t: 0, helped: false, fall: 0 };
  const j = W.spots.jar;
  JAR_MODEL.position.set(j.x, j.y, j.z); JAR_MODEL.rotation.set(0, 0, 0); JAR_MODEL.visible = true;
  Object.assign(G.p, { x: j.x, y: j.y + 0.6, z: j.z, vx: 0, vy: 0, vz: 0 });
  $('jar').classList.remove('hidden'); $('jar-meter').style.width = '0%';
  toast(how === 'sleep' ? `Pendant ton sommeil, ${who} t’a trouvé et enfermé dans un bocal !` : `${who} t’a attrapé et enfermé dans un bocal sur l’étagère !`, 'danger', 6000);
  toast(`Captures aujourd’hui : ${G.capturesToday}/${CONFIG.capture.maxPerDay}. À 3, c’est la fin !`, 'warn', 6000);
}
function jarKey(code) {
  const J = G.jar; if (!J || J.fall) return;
  const side = code === 'KeyA' || code === 'ArrowLeft' ? 'L' : code === 'KeyD' || code === 'ArrowRight' ? 'R' : null;
  if (side && side !== J.last) {
    J.meter = Math.min(100, J.meter + 6.5); J.last = side; SFX.play('jar');
    if (J.meter >= 100) { J.fall = 0.001; SFX.play('whoosh'); }
  }
}
function updateJar(dt) {
  const J = G.jar, j = W.spots.jar; if (!J) return;
  J.t += dt;
  if (J.fall > 0) {
    J.fall += dt; const k = Math.min(1, J.fall / 0.8);
    JAR_MODEL.rotation.z = -k * 1.6; JAR_MODEL.position.set(j.x + k * 35, j.y - k * k * 188, j.z);
    G.p.x = JAR_MODEL.position.x; G.p.y = JAR_MODEL.position.y + 1; G.p.z = j.z;
    if (k >= 1) releaseFromJar();
    return;
  }
  if (J.meter >= 100) { J.fall = 0.001; SFX.play('whoosh'); return; }
  J.meter = Math.max(0, J.meter - 7 * dt);
  if (G.cat.aff >= 40 && J.t > 5) {
    if (!J.helped) { J.helped = true; toast('Moustache grimpe sur l’étagère pour t’aider !', 'success'); SFX.play('meow'); }
    J.meter += 9 * dt;
  }
  JAR_MODEL.rotation.z = Math.sin(J.t * 9) * (J.meter / 100) * 0.25;
  G.p.x = j.x; G.p.y = j.y + 0.6; G.p.z = j.z;
  $('jar-meter').style.width = Math.min(100, J.meter) + '%';
}
function releaseFromJar() {
  JAR_MODEL.visible = false; $('jar').classList.add('hidden');
  Object.assign(G.p, { x: 72, y: 0, z: 495, vx: 0, vy: 0, vz: 0, onGround: false, airTop: undefined });
  G.mode = 'walk'; G.jar = null; SFX.play('thud');
  emitNoise(60, 0, 495, 320, 0.5, 'objet');
  toast('Le bocal a basculé : tu es libre ! Vite, cache-toi !', 'success');
}
function gameOver(title, text) {
  G.mode = 'dead'; G.rest = null; SFX.engine(false, 0);
  $('jar').classList.add('hidden'); $('restbar').classList.add('hidden'); JAR_MODEL.visible = false;
  $('over-title').textContent = title; $('over-text').textContent = text;
  $('btn-over-load').disabled = !(loadSave(CHECK_KEY) || loadSave(SAVE_KEY));
  UI.open('over');
}
function onDogBite(dog) {
  const P = G.p, dx = P.x - dog.x, dz = P.z - dog.z, d = Math.hypot(dx, dz) || 1;
  if (G.mode === 'car') { const C = G.car; C.vx += (dx / d) * 160; C.vz += (dz / d) * 160; C.vy = 110; C.onGround = false; damage(8, 'Rex mord la voiture'); }
  else {
    if (G.mode === 'cat') endRide();
    P.vx = (dx / d) * 140; P.vz = (dz / d) * 140; P.vy = 170; P.onGround = false; P.airTop = P.y;
    const A = G.armor;
    if (A && A.on && A.dur > 0) {
      damage(CONFIG.dog.biteDmg * 0.25, 'Morsure de Rex (armure)'); A.dur--;
      if (A.dur <= 0) { A.on = false; INV.remove('armure', 1); toast('🛡️ Ton armure a cédé sous les crocs de Rex !', 'danger'); }
      else toast(`🛡️ L’armure encaisse la morsure (encore ${A.dur}).`, 'info');
      refreshEquip();
    } else damage(CONFIG.dog.biteDmg, 'Morsure de Rex');
  }
  G.shake = 1; SFX.play('hurt');
}

// ---------- Grand Prix du salon ----------
const RACE_GATES = [
  { x: 330, y: 0, z: 545, a: Math.PI / 2 }, { x: 72, y: 0, z: 638, a: Math.PI / 2 }, { x: 262, y: 43, z: 638, a: Math.PI / 2 },
  { x: 385, y: 0, z: 715, a: Math.PI / 2 }, { x: 446, y: 0, z: 606, a: Math.PI / 2 }, { x: 505, y: 0, z: 555, a: 0 },
];
function buildGates() {
  GATES = RACE_GATES.map((g, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(13, 1.1, 6, 24), new THREE.MeshBasicMaterial({ color: i === RACE_GATES.length - 1 ? 0xffffff : 0xff7a00, transparent: true, opacity: 0.85 }));
    m.position.set(g.x, g.y + 13, g.z); m.rotation.y = g.a; m.visible = false; SCENE.add(m); return m;
  });
}
function startRace() {
  G.race = { t: 0, gate: 0 }; GATES.forEach((g) => (g.visible = true));
  $('racehud').classList.remove('hidden'); SFX.play('quest');
  toast('🏁 Partez ! 6 portiques : nord de la table, bas de la piste orange, table basse, sud, tremplin, arrivée. Moins de 40 s !', 'info', 7000);
}
function updateRace(dt) {
  const R = G.race; R.t += dt;
  const g = RACE_GATES[R.gate], P = G.p;
  GATES.forEach((m, i) => { m.material.opacity = i === R.gate ? 0.95 : i > R.gate ? 0.25 : 0; m.scale.setScalar(i === R.gate ? 1 + Math.sin(R.t * 6) * 0.08 : 1); });
  if (G.mode === 'car' && dist2(P.x, P.z, g.x, g.z) < 24 && Math.abs(P.y - g.y) < 22) {
    R.gate++; SFX.play('pickup');
    if (R.gate >= RACE_GATES.length) { endRace(R.t <= 40); return; }
  }
  $('racehud').textContent = `🏁 ${R.t.toFixed(1).replace('.', ',')} s · portique ${R.gate + 1}/${RACE_GATES.length}`;
  if (R.t > 90) endRace(false, 'Temps écoulé : course annulée.');
}
function endRace(win, msg) {
  const t = G.race ? G.race.t : 0;
  G.race = null; GATES.forEach((g) => (g.visible = false)); $('racehud').classList.add('hidden');
  if (win) { G.flags.raceWon = true; SFX.play('win'); toast(`🏆 Victoire en ${t.toFixed(1).replace('.', ',')} s !`, 'success', 6000); }
  else toast(msg || `Trop lent : ${t.toFixed(1).replace('.', ',')} s (objectif : 40 s). Retente ta chance !`, 'warn', 6000);
}

function onVictory() {
  const s = G.stats;
  $('win-text').textContent = 'Ton avion de papier s’est glissé par la lucarne : le Petit Peuple t’accueille en héros ! La cabane est désormais une base sûre (un tunnel mène au jardin). Tu peux continuer à jouer et terminer les quêtes secondaires.';
  $('win-stats').innerHTML = `<span>Jours survécus</span><b>${G.day}</b><span>Captures</span><b>${s.captures}</b><span>Fois repéré</span><b>${s.spotted}</b><span>Étoiles</span><b>${G.stars} ⭐</b><span>Quêtes secondaires</span><b>${Object.keys(G.side).length}/${SIDE.length}</b>`;
  saveGame(); SFX.play('win');
  setTimeout(() => UI.open('win'), 600);
}

// ---------- perception (4 fois par seconde) ----------
function perceptionTick() {
  const P = G.p, room = roomAt(P.x, P.z), c = coverInfo(P.x, P.y, P.z);
  G.flags.inBase = inBaseArea(P.x, P.y, P.z) && G.mode !== 'flight' && G.mode !== 'jar';
  G.flags.inFur = G.mode !== 'jar' && G.mode !== 'flight' && inCatFur(P.x, P.y, P.z);
  G.flags.inCastle = G.mode !== 'jar' && G.mode !== 'flight' && inCastleZone(P.x, P.y, P.z);
  const sp = Math.hypot(P.vx, P.vz);
  G.pvis = {
    light: lightAt(P.x, P.y, P.z), crouch: G.crouch && G.mode === 'walk', moving: sp > 5, inCar: G.mode === 'car', onCat: G.mode === 'cat',
    elevated: P.y > 35 && !c.covered, cover: c.covered, low: c.low && c.deep >= 3, grass: !!(room && room.id === 'jardin' && P.y < 2 && !onPath(P.x, P.z)),
  };
  let st = 0;
  for (const h of HUMANS) { if (h.state === 'chase' || h.state === 'grab') st = 2; else if (st < 1 && (h.seeing > 0.02 || ((h.state === 'investigate' || h.state === 'search') && h.mem > 0))) st = 1; }
  if (Dog.state === 'chase' || Dog.state === 'bark') st = 2; else if (st < 1 && (Dog.state === 'track' || Dog.state === 'alert')) st = 1;
  G.alertState = G.mode === 'jar' ? 0 : st;
  G.hideHere = hideScore(P.x, P.y, P.z);
  const it = !G.rest && G.mode !== 'jar' ? findInteraction() : null;
  let pr = it ? `<kbd>E</kbd> ${it.label}` : '';
  if (!pr && G.mode === 'walk') {
    if (!carStowed() && Math.hypot(G.car.x - P.x, G.car.z - P.z) < 16 && Math.abs(G.car.y - P.y) < 6) pr = '<kbd>F</kbd> Monter dans la voiture';
    else if (G.cat.aff >= CONFIG.cat.rideAff && Cat && Math.hypot(Cat.x - P.x, Cat.z - P.z) < 26 && Math.abs(Cat.y - P.y) < 20) pr = '<kbd>F</kbd> Monter sur Moustache';
    else if (INV.slots[G.sel] && INV.slots[G.sel].id === 'cube') pr = isExploring() ? '<small>🧭 Exploration · <kbd>B</kbd> : construire</small>' : '<small>🧱 Clic droit : poser un cube · clic gauche : le récupérer · <kbd>B</kbd> : explorer</small>';
  }
  if (!pr && G.mode === 'cat') pr = '<small>🐱 <kbd>Espace</kbd> bond · <kbd>Maj</kbd> galop · <kbd>F</kbd> descendre</small>';
  G.prompt = pr;
  if (room && G.mode !== 'jar' && G.mode !== 'flight') {
    if (!G.visited[room.id]) { G.visited[room.id] = 1; if (Object.keys(G.visited).length > 1) toast(`Nouvelle zone découverte : ${room.name}`, 'info', 2500); }
    if (G.kcRoom !== room.id) {
      if (G.kcRoom === 'cuisine' && G.kcClean) Missions.event('kitchenCross');
      G.kcClean = room.id === 'cuisine'; G.kcRoom = room.id;
    }
    if (room.id === 'cuisine' && st > 0) G.kcClean = false;
    if (room.id === 'jardin') { const t = Math.floor(G.time); if (G.gm !== undefined && t > G.gm) Missions.event('gardenMin', { n: t - G.gm }); G.gm = t; } else G.gm = undefined;
  }
  if (P.y >= 178 && P.x > 1125 && P.x < 1198 && P.z > 428 && P.z < 498) G.flags.fridgeTop = true;
  if (!G.flags.chatiere && G.cat.aff >= 40) { G.flags.chatiere = true; toast('🐱 Moustache t’a montré la chatière de la cuisine : le jardin t’est ouvert !', 'success', 7000); SFX.play('quest'); }
  for (const p of W.puddles) if (dist2(P.x, P.z, p.x, p.z) < p.r && P.y < 2) Scent.wash();
  eggPerception();
  if (INV.count('carte') && !G.minimapSeen) { G.minimapSeen = true; G.minimap = true; }
  if (G.rest) $('restbar').innerHTML = `${G.rest.sleep ? '😴 Sommeil' : '🛋️ Repos'} — ${fmtClock(G.time % 1440)} · énergie ${Math.floor(G.s.energie)} · cachette ${G.rest.score}/100<br><small>Appuie sur T pour ${G.rest.sleep ? 'te réveiller' : 'te relever'}</small>`;
}

// ---------- entrées ----------
let FREE_MOUSE = false, LOCK_TESTED = false;
function onKey(e) {
  SFX.init();
  if (!G.started || G.mode === 'dead') return;
  const k = (e.key || '').toLowerCase(), code = e.code;
  if (UI.panel) {
    const p = UI.panel;
    if (p === 'title' || p === 'over' || p === 'win') return;
    if (code === 'Escape' || ((k === 'i' || code === 'Tab') && (p === 'inv' || p === 'lib')) || ((k === 'm' || k === 'j') && p === 'journal')) UI.close();
    return;
  }
  if (code === 'Escape' && G.freeMouse) { UI.open('pause'); return; }
  if (G.mode === 'jar') { jarKey(code); return; }
  if (code.startsWith('Digit')) { const n = +code.slice(5); if (n >= 1 && n <= CONFIG.hotbar) { G.sel = n - 1; UI.dirty = true; } return; }
  if (G.rest) {
    if (k === 't') { if (G.rest.forced) toast('Trop épuisé pour te relever : attends 25 % d’énergie.', 'warn'); else stopRest('Tu te lèves.'); }
    return;
  }
  if (code === 'Tab' || k === 'i') { UI.open('inv'); return; }
  switch (k) {
    case 'e': interact(); break;
    case 'f': toggleVehicle(); break;
    case 'm': case 'j': UI.open('journal'); break;
    case 't': if (G.mode === 'walk') UI.openRest(); else toast('Descends de ton véhicule pour te reposer.', 'info'); break;
    case 'v': G.cam3 = !G.cam3; break;
    case 'c': if (G.mode === 'walk') G.crouch = !G.crouch; break;
    case 'g': throwSelected(); break;
    case 'b': toggleBuildMode(); break;
    case 'r': callCat(); break;
  }
}
function onMouseDown(e) {
  SFX.init();
  if (!G.started || UI.panel || G.mode === 'dead') return;
  if (!Input.locked && !G.freeMouse) { tryLock(); return; }
  if (G.freeMouse && e.button === 0) { Input.dragging = true; G.click = { x: e.clientX, y: e.clientY, t: performance.now() }; return; }
  if (G.rest || G.mode === 'jar') return;
  if (e.button === 0) breakCube();
  else if (e.button === 2) useInvSlot(G.sel);
}
function onMouseUp(e) {
  if (!G.freeMouse || !G.click || e.button !== 0) return;
  const c = G.click; G.click = null;
  if (Math.hypot(e.clientX - c.x, e.clientY - c.y) < 5 && performance.now() - c.t < 300 && G.started && !UI.panel && !G.rest) breakCube();
}
function onWheel(e) { if (!G.started || UI.panel) return; G.sel = (G.sel + (e.deltaY > 0 ? 1 : -1) + CONFIG.hotbar) % CONFIG.hotbar; UI.dirty = true; }
function onLockChange(locked) { if (!locked && G.started && !UI.panel && G.mode !== 'dead' && !G.freeMouse) UI.open('pause'); }
function tryLock() {
  if (G.freeMouse) return;
  Input.lock();
  if (!LOCK_TESTED) {
    LOCK_TESTED = true;
    setTimeout(() => { if (!Input.locked && G.started && !UI.panel) { FREE_MOUSE = G.freeMouse = true; toast('Capture de la souris indisponible : maintiens le clic gauche et glisse pour regarder.', 'info', 8000); } }, 800);
  }
}

// ------------------------------ DÉMARRAGE ------------------------------
async function boot() {
  initRender();
  buildWorld(SCENE);
  defineSpawns();
  buildNav();
  new Human('marc', 'Marc', { scale: 1, shirt: 0x3d6fb6, pants: 0x2b3a55, skin: 0xe0ac69, hair: 0x4a3222, shoes: 0x222222 }, CONFIG.human.vision);
  new Human('lea', 'Léa', { scale: 0.73, shirt: 0xf06292, pants: 0x5c4b8a, skin: 0xf1c27d, hair: 0x8d5524, shoes: 0xfafafa, pigtails: true }, CONFIG.human.vision * 0.85);
  Dog = new DogAI(); Cat = new CatAI(); Fish = new FishAI();
  PLAYER_MODEL = makePlayerModel(); SCENE.add(PLAYER_MODEL);
  CAR_MODEL = makeCarModel(); SCENE.add(CAR_MODEL);
  PLANE_MODEL = makePlaneModel(); PLANE_MODEL.visible = false; SCENE.add(PLANE_MODEL);
  JAR_MODEL = makeJarModel(); JAR_MODEL.visible = false; SCENE.add(JAR_MODEL);
  MARKER = makeTargetMarker(); MARKER.visible = false; SCENE.add(MARKER);
  CAR_BEACON = textSprite('🚗', '#f47a1f'); CAR_BEACON.visible = false; SCENE.add(CAR_BEACON);
  placeEnder(0);
  buildGates();
  for (const [x, z, a, c] of [[1020, 1480, 1, 0x2e7d32], [1125, 1500, -1.2, 0x6a1b9a], [1065, 1560, 3, 0x1565c0], [1090, 1440, 0.3, 0xef6c00]]) {
    const m = makePlayerModel({ hood: c, cap: 0x5d4037 }); m.position.set(x, 1, z); m.rotation.y = a; SCENE.add(m);
  }
  UI.init();
  Input.init(RENDERER.domElement);
  Input.h.key = onKey; Input.h.mousedown = onMouseDown; Input.h.wheel = onWheel; Input.h.lock = onLockChange;
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('mousemove', (e) => { if (Input.locked || Input.dragging) G.lastMouse = performance.now(); });
  for (const h of HUMANS) { h.setActivity(schedAt(h.id, 9), true); h.render(0); }
  Dog.render(0); Cat.render(0); CAR_MODEL.position.set(935, 0.4, 15); CAR_MODEL.rotation.y = Math.PI / 2;
  buildEventDecor();
  updateLighting(0);
  applyStyle(SETTINGS.style);
  addEventListener('beforeunload', () => saveGame());
  // fenêtre quittée (autre programme, autre onglet) : pause, le rendu ralentit à 5 images/s
  addEventListener('blur', () => { if (G.started && !UI.panel && G.mode !== 'dead') UI.open('pause'); });
  // Accès de débogage (console) : window.__minuscule
  window.__minuscule = {
    get G() { return G; }, HUMANS, INV, CHEST, SPAWNS, PICKUPS, CUBES, W, SOLIDS, RAMPS, get Dog() { return Dog; }, get Cat() { return Cat; },
    freeMouse() { FREE_MOUSE = G.freeMouse = true; UI.close(false); },
    tp(x, y, z) { Object.assign(G.p, { x, y, z, vx: 0, vy: 0, vz: 0, onGround: false }); },
    give: giveItem, setHour(h) { G.time = (G.day - 1) * 1440 + h * 60; },
    PERF, get renderer() { return RENDERER; }, get scene() { return SCENE; },
    capture: () => onCaptured(HUMANS[0]), setAff: (v) => { G.cat.aff = v; }, EGGS, BBQ, toggleInvis, spawnCrystal, stowCar, deployCar, hideScore: () => hideScore(G.p.x, G.p.y, G.p.z), unreach: () => isUnreachable(G.p.x, G.p.y, G.p.z),
    DB, saveGame, removePickup, emitNoise, onDogBite, useSlot: (i) => useInvSlot(i), setDay(d) { G.time = (d - 1) * 1440 + (G.time % 1440); G.day = d; G.lastDay = d; startEventsForDay(true); }, accident: () => triggerAccident(), get ev() { return G.ev; },
    advance(sec, render = false) { for (let i = 0; i < sec * 20; i++) { step(0.05); updateCamera(0.05); } UI.hud(); if (render) { styleFrame(); RENDERER.render(SCENE, CAM); } },
    CASTLE, inCastleZone, RES, applyQuality, applyStyle, styleFrame, get STYLE() { return STYLE; }, get camera() { return CAM; },
    get UI() { return UI; }, key: (code, key) => onKey({ code, key: key || '' }), drop: dropFromPlayer, ghost: () => CUBE_GHOST, Input, toggleVehicle, NAV, buildNav, removeSolid,
  };
  await DB.init();
  $('loading').classList.add('hidden');
  window.__MINUSCULE_OK = true;
  UI.open('title');
  requestAnimationFrame(frame);
}
boot().catch((err) => {
  console.error(err);
  const m = $('loading-msg'); if (m) m.textContent = 'Erreur au démarrage : ' + err.message;
});
