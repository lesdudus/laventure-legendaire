// ------------------------------ JOUEUR : MARCHE, VOITURE, CHAT, AVION ------------------------------
let _stepT = 0, _scentT = 0, _carNoiseT = 0, _carDistAcc = 0;
// panneau ouvert (le temps continue) : le joueur reste immobile
const moveInput = () => (UI.panel ? { fw: 0, st: 0 } : {
  fw: (Input.down('KeyW', 'ArrowUp') ? 1 : 0) - (Input.down('KeyS', 'ArrowDown') ? 1 : 0),
  st: (Input.down('KeyD', 'ArrowRight') ? 1 : 0) - (Input.down('KeyA', 'ArrowLeft') ? 1 : 0),
});
function camDir(fw, st) {
  const fx = -Math.sin(G.yaw), fz = -Math.cos(G.yaw), rx = Math.cos(G.yaw), rz = -Math.sin(G.yaw);
  let dx = fx * fw + rx * st, dz = fz * fw + rz * st; const l = Math.hypot(dx, dz);
  return l > 0 ? [dx / l, dz / l] : [0, 0];
}
function spotFree(x, y, z, r, h) {
  for (const s of querySolids(x - r, z - r, x + r, z + r)) {
    if (s.y1 <= y + 0.5 || s.y0 >= y + h) continue;
    const cx = clamp(x, s.x0, s.x1), cz = clamp(z, s.z0, s.z1);
    if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return false;
  }
  return true;
}

function updatePlayer(dt) {
  G.sprinting = false;
  if (!G.rest) {
    if (G.mode === 'walk') updateWalk(dt);
    else if (G.mode === 'car') updateCar(dt);
    else if (G.mode === 'cat') updateRide(dt);
    else if (G.mode === 'flight') updateFlight(dt);
    else if (G.mode === 'jar') updateJar(dt);
  } else if (G.mode === 'car') SFX.engine(false, 0);
  breathTick(dt, G.sprinting);
  if (G.mode !== 'cat') G.cat.ride = Math.min(CONFIG.cat.rideTime, (G.cat.ride ?? CONFIG.cat.rideTime) + (CONFIG.cat.rideTime / CONFIG.cat.rideRest) * dt);
  if (G.race) updateRace(dt);
  updatePlayerModel(dt);
}

// Souffle 💨 : baisse en courant à pied, remonte 1 s après l'arrêt de la course
function breathTick(dt, running) {
  const B = G.breath, cfg = CONFIG.breath;
  if (running) {
    B.v = Math.max(0, B.v - (100 / cfg.runSec) * dt); B.wait = cfg.delay;
    if (B.v <= 0 && !B.out) { B.out = true; toast('💨 À bout de souffle ! Marche un peu pour reprendre ton souffle.', 'warn', 2500); }
    return;
  }
  if (B.wait > 0) { B.wait -= dt; return; }
  if (B.v < 100) { B.v = Math.min(100, B.v + (100 / cfg.refillSec) * dt); if (B.v >= 100) B.fullT = G.simT; }
  if (B.out && B.v >= cfg.resume) B.out = false;
}

function updateWalk(dt) {
  const P = G.p, S = G.s, cfg = CONFIG.player;
  const tired = S.energie < CONFIG.stats.low;
  const { fw, st } = moveInput();
  const sprint = Input.down('ShiftLeft', 'ShiftRight') && !tired && !G.crouch && fw > 0 && !G.breath.out;
  let speed = G.crouch ? cfg.crouchSpeed : sprint ? cfg.sprint : cfg.walk;
  if (tired) speed *= 0.5;
  const [dx, dz] = camDir(fw, st);
  const k = Math.min(1, (P.onGround ? 12 : 4.5) * dt);
  P.vx = lerp(P.vx, dx * speed, k); P.vz = lerp(P.vz, dz * speed, k);
  // saut tolérant : on peut sauter juste après avoir quitté un bord, et un appui un peu trop tôt est mémorisé
  P.grav = cfg.gravScale;
  G.coyote = P.onGround ? cfg.coyote : Math.max(0, (G.coyote || 0) - dt);
  if (Input.down('Space') && !G.jumpHeld && !UI.panel) { G.jumpHeld = true; G.jumpBuf = cfg.jumpBuffer; }
  else G.jumpBuf = Math.max(0, (G.jumpBuf || 0) - dt);
  if (G.jumpBuf > 0 && G.coyote > 0) {
    G.jumpBuf = 0;
    P.vy = Math.sqrt(2 * CONFIG.gravity * cfg.gravScale * cfg.jumpHeight); P.onGround = false; G.coyote = 0; P.airTop = P.y;
    S.energie = Math.max(0, S.energie - CONFIG.stats.jumpEnergy); Missions.event('jump');
  }
  if (!Input.down('Space')) G.jumpHeld = false;
  const chute = !P.onGround && P.vy < -50 && Input.down('Space') && INV.count('parachute') > 0;
  P.maxFall = chute ? 38 : 0; if (chute) P.chuted = true;
  const wantH = G.crouch ? cfg.crouchHeight : cfg.height;
  if (wantH > P.h) { if (ceilingAt(P.x, P.z, P.r * 0.8, P.y + P.h) >= P.y + wantH) P.h = wantH; } else P.h = wantH;
  moveBody(P, dt);
  if (P.landed) {
    const fall = P.landed;
    if (fall > cfg.fallSafe && !P.chuted) { damage((fall - cfg.fallSafe) * cfg.fallDmg, 'Chute'); SFX.play('hurt'); }
    if (fall > 25) { emitNoise(P.x, P.y, P.z, 40 + fall, 0.25, 'joueur'); SFX.play('thud', 0.4); }
    P.chuted = false; P.airTop = undefined;
  }
  if (P.fellOut) { P.fellOut = false; Object.assign(P, { x: W.base.spawn.x, y: 0, z: W.base.spawn.z, vx: 0, vy: 0, vz: 0 }); toast('Tu as été ramené à ta base.', 'warn'); }
  const hs = Math.hypot(P.vx, P.vz);
  if (sprint && hs > 10) G.sprinting = true;
  if (hs > 5) G.face = Math.atan2(P.vx, P.vz);
  _stepT -= dt;
  if (P.onGround && hs > 8 && _stepT <= 0) {
    _stepT = sprint ? 0.24 : G.crouch ? 0.6 : 0.36;
    SFX.play('step', sprint ? 1.5 : G.crouch ? 0.4 : 1);
    if (!G.crouch) emitNoise(P.x, P.y, P.z, sprint ? 75 : 28, sprint ? 0.32 : 0.12, 'joueur');
  }
  _scentT -= dt;
  if (hs > 3 && P.y < 4 && _scentT <= 0 && !G.flags.inCastle && !isInvisible()) { _scentT = 0.4; Scent.drop(P.x, P.z, G.simT); }
}

function updateCar(dt) {
  const C = G.car, P = G.p, cfg = CONFIG.car;
  const { fw, st } = moveInput();
  const room = roomAt(C.x, C.z), grass = room && room.id === 'jardin' && C.y < 2 && !onPath(C.x, C.z);
  const maxS = cfg.maxSpeed * (G.upgrades.turbo ? cfg.turbo : 1) * (grass && !G.upgrades.pneus ? cfg.grass : 1);
  const hx = Math.sin(C.heading), hz = Math.cos(C.heading);
  let vL = C.vx * hx + C.vz * hz, vT = C.vx * hz - C.vz * hx;
  if (C.onGround) {
    if (fw > 0) vL += cfg.accel * dt * (vL < 0 ? 2.5 : 1);
    else if (fw < 0) vL -= (vL > 5 ? cfg.brake : cfg.accel * 0.6) * dt;
    else vL -= vL * cfg.drag * dt;
    if (vL > maxS) vL = lerp(vL, maxS, Math.min(1, dt * 3));
    vL = Math.max(vL, -cfg.reverse);
    if (!fw && Math.abs(vL) < 3) vL = 0;
    const grip = Input.down('Space') ? cfg.driftGrip : cfg.grip;
    vT -= vT * Math.min(1, grip * dt);
    C.vx = vL * hx + vT * hz; C.vz = vL * hz - vT * hx;
    const kk = cfg.steer * Math.min(1, Math.abs(vL) / 35) * (1 - 0.45 * Math.min(1, Math.abs(vL) / cfg.maxSpeed));
    C.heading -= st * kk * dt * Math.sign(vL || 1) * (Input.down('Space') ? 1.35 : 1);
  }
  C.grav = !C.onGround && G.upgrades.ailerons && Input.down('Space') ? 0.3 : 1;
  if (!C.onGround && G.upgrades.ailerons && Input.down('Space')) C.heading -= st * 1.4 * dt;
  const wasGround = C.onGround;
  moveBody(C, dt);
  if (wasGround && !C.onGround && C.leftRamp && C.leftRamp.kind === 'launch') {
    const R = C.leftRamp, sp0 = Math.hypot(C.vx, C.vz);
    if (sp0 > 110) {
      const k = R.v / sp0; C.vx *= k; C.vz *= k; C.vy = R.vy;
      SFX.play('whoosh'); G.shake = Math.max(G.shake, 0.5); toast('🚀 Propulsion !', 'success');
    }
    C.leftRamp = null;
  }
  if (C.impact > 70) { SFX.play('thud', Math.min(1, C.impact / 200)); emitNoise(C.x, C.y, C.z, 160, 0.45, 'voiture'); G.shake = Math.max(G.shake, 0.4); }
  if (C.fellOut) { C.fellOut = false; C.x = 935; C.y = 0.4; C.z = 15; C.vx = C.vz = C.vy = 0; }
  const sp = Math.hypot(C.vx, C.vz), s01 = clamp(sp / cfg.maxSpeed, 0, 1);
  SFX.engine(true, s01);
  _carNoiseT -= dt;
  if (_carNoiseT <= 0) {
    _carNoiseT = 0.4;
    const q = G.upgrades.silencieux ? 0.5 : 1;
    emitNoise(C.x, C.y, C.z, (110 + 360 * s01) * q, (0.25 + 0.4 * s01) * q, 'voiture');
  }
  _carDistAcc += sp * dt;
  if (_carDistAcc > 100) { Missions.event('carDist', { n: _carDistAcc }); _carDistAcc = 0; }
  P.x = C.x; P.y = C.y + 1; P.z = C.z; P.vx = C.vx; P.vz = C.vz; P.vy = C.vy; P.onGround = C.onGround;
  // rendu : tangage selon la pente, roues
  const u = CAR_MODEL.userData;
  CAR_MODEL.position.set(C.x, C.y, C.z);
  let pitch = 0;
  if (C.onGround) { const hf = groundAt(C.x + hx * 4.5, C.z + hz * 4.5, 0.4, C.y + 4), hb = groundAt(C.x - hx * 4.5, C.z - hz * 4.5, 0.4, C.y + 4); pitch = Math.atan2(hb - hf, 9); }
  else pitch = -Math.atan2(C.vy, Math.max(30, sp)) * 0.6;
  CAR_MODEL.rotation.set(lerp(CAR_MODEL.rotation.x, pitch, Math.min(1, dt * 10)), C.heading, 0, 'YXZ');
  u.wheels.forEach((w, i) => { w.rotation.order = 'YXZ'; w.rotation.x += (vL * dt) / (i < 2 ? 1.05 : 1.45); if (i < 2) w.rotation.y = -st * 0.4; });
  if (!Input.locked || performance.now() - (G.lastMouse || 0) > 1200) G.yaw = turnTo(G.yaw, C.heading + Math.PI, dt * 2.5);
}

function enterCar() {
  G.mode = 'car'; G.crouch = false; G.car.vx = G.car.vz = 0;
  enterCarVisual(); SFX.play('door', 0.6);
  toast('En voiture ! ZQSD/WASD pour conduire, Espace = frein à main (drift), F pour descendre.', 'info');
}
function enterCarVisual() {
  const seat = CAR_MODEL.userData.seat; seat.add(PLAYER_MODEL);
  PLAYER_MODEL.position.set(0, 0, 0); PLAYER_MODEL.rotation.set(0, 0, 0); PLAYER_MODEL.scale.setScalar(0.82);
  const u = PLAYER_MODEL.userData; u.legL.rotation.x = u.legR.rotation.x = -1.5; u.armL.rotation.x = u.armR.rotation.x = -1.1;
}
function leaveVehicleVisual() {
  SCENE.add(PLAYER_MODEL); PLAYER_MODEL.scale.setScalar(1); PLAYER_MODEL.rotation.set(0, 0, 0);
}
function exitCar() {
  const C = G.car, P = G.p, hx = Math.sin(C.heading), hz = Math.cos(C.heading);
  const cands = [[hz * 6.5, -hx * 6.5], [-hz * 6.5, hx * 6.5], [-hx * 9, -hz * 9], [hx * 9, hz * 9]];
  let ok = null;
  for (const [ox, oz] of cands) { const x = C.x + ox, z = C.z + oz, y = groundAt(x, z, 1, C.y + 3); if (Math.abs(y - C.y) < 4 && spotFree(x, y, z, P.r, P.h)) { ok = [x, y, z]; break; } }
  if (!ok) ok = [C.x, C.y + 5.4, C.z];
  [P.x, P.y, P.z] = ok; P.vx = P.vy = P.vz = 0; P.onGround = false;
  G.mode = 'walk'; SFX.engine(false, 0); leaveVehicleVisual();
  if (G.race) endRace(false, 'Course abandonnée.');
}

function startRide() {
  const cfg = CONFIG.cat;
  if (!SETTINGS.catUnlimited && G.cat.ride < cfg.rideMin) { toast(`Moustache se repose encore… Réessaie dans ${Math.ceil((cfg.rideMin - G.cat.ride) * cfg.rideRest / cfg.rideTime)} s.`, 'warn'); return; }
  G.mode = 'cat'; G.crouch = false; Cat.state = 'ridden'; Cat.jump = null; Cat.after = null;
  G.ride = { h: Cat.ry, tired: false };
  G.rideB = body(Cat.x, Cat.y, Cat.z, 8, 26, 6);
  G.rideB.ignore = (s) => s.tag === 'flap';   // Moustache passe toujours par sa chatière
  Cat.model.add(PLAYER_MODEL); PLAYER_MODEL.position.set(0, 22, -2); PLAYER_MODEL.rotation.set(0, 0, 0); PLAYER_MODEL.scale.setScalar(1.6);
  const u = PLAYER_MODEL.userData; u.legL.rotation.x = -1.2; u.legR.rotation.x = -1.2;
  Missions.event('catRide');
  SFX.play('meow');
  toast(`🐱 En selle ! Maj = galop, Espace = bond (1,30 m), F pour descendre. Personne ne te voit sur Moustache.${SETTINGS.catUnlimited ? '' : ` Il se fatigue au bout de ${Math.round(G.cat.ride)} s (jauge 🐱).`}`, 'success');
}
function updateRide(dt) {
  const B = G.rideB, R = G.ride, cfg = CONFIG.cat, { fw, st } = moveInput();
  const gallop = Input.down('ShiftLeft', 'ShiftRight');
  const [dx, dz] = camDir(fw, st);
  let al = 0;
  // virages souples : Moustache pivote vers la direction voulue, puis avance
  if (dx || dz) {
    const tgt = Math.atan2(dx, dz);
    R.h = turnTo(R.h, tgt, dt * (gallop ? 4.5 : 6.5));
    al = Math.max(0, Math.cos(angWrap(tgt - R.h)));
  }
  const speed = (gallop ? cfg.rideRun : cfg.rideWalk) * al;
  const k = Math.min(1, (B.onGround ? 8 : 2.5) * dt);
  B.vx = lerp(B.vx, Math.sin(R.h) * speed, k); B.vz = lerp(B.vz, Math.cos(R.h) * speed, k);
  if (Input.down('Space') && !G.jumpHeld && !UI.panel) { G.jumpHeld = true; R.jumpBuf = 0.2; } else R.jumpBuf = Math.max(0, (R.jumpBuf || 0) - dt);
  R.coyote = B.onGround ? 0.12 : Math.max(0, (R.coyote || 0) - dt);
  if (R.jumpBuf > 0 && R.coyote > 0) { R.jumpBuf = 0; R.coyote = 0; B.vy = Math.sqrt(2 * CONFIG.gravity * cfg.rideJump); B.onGround = false; SFX.play('whoosh', 0.5); }
  if (!Input.down('Space')) G.jumpHeld = false;
  moveBody(B, dt);
  // sous le plafond de la maison (250 cm, non solide) : le cavalier ne le traverse pas
  if (B.x > 0 && B.x < 1200 && B.z > 0 && B.z < 850 && B.y > 222) { B.y = 222; B.vy = Math.min(0, B.vy); }
  if (B.fellOut) { B.fellOut = false; Object.assign(B, { x: W.base.spawn.x + 20, y: 0, z: W.base.spawn.z + 20, vx: 0, vy: 0, vz: 0 }); endRide('Oups ! Moustache te ramène près de ta base.'); return; }
  const hs = Math.hypot(B.vx, B.vz);
  Cat.x = B.x; Cat.y = B.y; Cat.z = B.z; Cat.speed = hs; Cat.ry = R.h;
  Cat.render(dt);
  G.p.x = B.x; G.p.y = B.y + 18; G.p.z = B.z; G.p.vx = B.vx; G.p.vz = B.vz; G.p.vy = B.vy;
  if (B.onGround && B.y >= 214 && B.x > 344 && B.x < 416 && B.z > 244 && B.z < 416 && !G.flags.catArmoire) { G.flags.catArmoire = true; toast('🐱 Tout en haut de l’armoire ! Quelle vue !', 'success'); }
  // la caméra se replace doucement derrière Moustache quand la souris ne bouge pas
  if (hs > 20 && (!Input.locked || performance.now() - (G.lastMouse || 0) > 1200)) G.yaw = turnTo(G.yaw, R.h + Math.PI, dt * 1.8);
  if (!SETTINGS.catUnlimited) {
    G.cat.ride = Math.max(0, G.cat.ride - dt);
    if (G.cat.ride <= 0 && B.onGround) endRide('😺 Moustache est fatigué : il te dépose doucement et s’allonge pour se reposer.', true);
  }
}
// point au sol, libre, près d'une position (pour que Moustache redescende d'un meuble)
function catFloorNear(x, z) {
  for (let r = 25; r <= 200; r += 15) for (let a = 0; a < 12; a++) {
    const px = x + Math.cos(a * Math.PI / 6) * r, pz = z + Math.sin(a * Math.PI / 6) * r;
    if (groundAt(px, pz, 8, 4) <= 2 && NAV.cat.freeAt(px, pz)) return { ax: px, az: pz };
  }
  return { ax: x, az: z };
}
function endRide(msg, tired = false) {
  const P = G.p, B = G.rideB;
  leaveVehicleVisual();
  // descente sûre : sur la même surface que Moustache, jamais dans un mur ni dans le vide
  let spot = null;
  for (const d of [12, 9, 6]) {
    for (let a = 0; a < 8 && !spot; a++) {
      const x = B.x + Math.cos(a * Math.PI / 4) * d, z = B.z + Math.sin(a * Math.PI / 4) * d, y = groundAt(x, z, P.r, B.y + 3);
      if (Math.abs(y - B.y) < 3 && spotFree(x, y, z, P.r, P.h)) spot = [x, y, z];
    }
    if (spot) break;
  }
  [P.x, P.y, P.z] = spot || [B.x, B.y, B.z];
  P.vx = P.vy = P.vz = 0; P.onGround = true; P.airTop = undefined; P.chuted = false;
  G.mode = 'walk'; G.ride = null;
  Cat.y = B.y; Cat.path = null; Cat.speed = 0; Cat.after = null;
  if (B.y > 5) Cat.spot = Object.assign({ x: B.x, y: B.y, z: B.z, nap: tired }, catFloorNear(B.x, B.z));
  if (tired) { G.cat.ride = 0; Cat.state = 'nap'; Cat.timer = CONFIG.cat.rideRest; }
  else { Cat.state = 'idle'; Cat.timer = 15; }
  if (msg) toast(msg + (tired && !SETTINGS.catUnlimited ? ` Tu pourras remonter dans ${Math.ceil(CONFIG.cat.rideMin * CONFIG.cat.rideRest / CONFIG.cat.rideTime)} s.` : ''), 'info');
}

function canLaunch() {
  if (INV.count('avion') <= 0 || G.mode !== 'walk') return false;
  const P = G.p;
  if (inZone(W.zones.sill, P.x, P.y, P.z)) return W.pane.open ? 'sill' : 'closed';
  const r = roomAt(P.x, P.z);
  if (r && r.id === 'jardin' && P.y >= 60) return 'garden';
  return false;
}
function launchPlane() {
  const P = G.p, yaw = G.yaw + Math.PI;
  G.mode = 'flight';
  G.flight = { x: P.x, y: P.y + 3, z: P.z, yaw, pitch: 0.08, speed: 210, motor: 8 };
  PLANE_MODEL.visible = true; PLANE_MODEL.add(PLAYER_MODEL); PLAYER_MODEL.position.set(0, 0.2, -1); PLAYER_MODEL.rotation.set(0, 0, 0); PLAYER_MODEL.scale.setScalar(0.9);
  G.flags.launched = true; SFX.play('whoosh'); emitNoise(P.x, P.y, P.z, 120, 0.3, 'joueur');
  toast('Décollage ! Souris ou ZQSD pour diriger. Vise la lucarne sur le toit de la cabane (marqueur ◆).', 'success', 7000);
}
function updateFlight(dt) {
  const F = G.flight, { fw, st } = moveInput();
  G.yaw -= st * 1.3 * dt; G.pitch = clamp(G.pitch - fw * 0.9 * dt, -0.6, 0.45);
  F.yaw = turnTo(F.yaw, G.yaw + Math.PI, dt * 3); F.pitch = lerp(F.pitch, clamp(G.pitch, -0.6, 0.45), Math.min(1, dt * 3));
  if (F.motor > 0) { F.motor -= dt; F.speed = lerp(F.speed, 240, Math.min(1, dt)); }
  else F.speed += (-Math.sin(F.pitch) * 380 - (F.speed - 140) * 0.25) * dt;
  F.speed = clamp(F.speed, 50, 340);
  if (F.speed < 80) { F.pitch = Math.min(F.pitch, -0.25); G.pitch = Math.min(G.pitch, -0.25); }
  const cp = Math.cos(F.pitch);
  const nx = F.x + Math.sin(F.yaw) * cp * F.speed * dt, ny = F.y + (Math.sin(F.pitch) * F.speed - 16) * dt, nz = F.z + Math.cos(F.yaw) * cp * F.speed * dt;
  if (inZone(W.zones.skylight, nx, ny, nz)) { enterColony(); return; }
  let hit = null;
  for (const s of querySolids(nx - 2.5, nz - 2.5, nx + 2.5, nz + 2.5)) if (ny > s.y0 - 1 && ny < s.y1 + 0.5 && s.tag !== 'glass') { hit = s; break; }
  if (hit || ny < -1) {
    const top = hit ? hit.y1 : 0;
    const gentle = (!hit || ny - top > -2.5) && Math.sin(F.pitch) * F.speed > -120;
    endFlight(nx, ny, nz, gentle);
    return;
  }
  F.x = nx; F.y = ny; F.z = nz;
  PLANE_MODEL.position.set(F.x, F.y, F.z);
  PLANE_MODEL.rotation.set(-F.pitch, F.yaw, -st * 0.5, 'YXZ');
  G.p.x = F.x; G.p.y = F.y; G.p.z = F.z;
}
function endFlight(x, y, z, gentle) {
  const P = G.p, F = G.flight;
  let px = x, pz = z, py = groundAt(px, pz, 1, y + 3);
  if (!spotFree(px, py, pz, P.r, P.h)) { px = F.x; pz = F.z; py = groundAt(px, pz, 1, F.y + 3); }
  P.x = px; P.y = py; P.z = pz; P.vx = P.vy = P.vz = 0; P.onGround = false; P.airTop = undefined;
  PLANE_MODEL.visible = false; leaveVehicleVisual(); G.mode = 'walk'; G.flight = null;
  if (gentle) toast('Atterrissage réussi ! Relance l’avion (E) depuis un point haut : rebord de fenêtre ou table du jardin.', 'info', 6000);
  else { damage(10, 'Crash'); SFX.play('thud'); toast('Crash ! L’avion est intact. Relance-le (E) depuis un point haut.', 'warn', 6000); }
  emitNoise(P.x, P.y, P.z, 150, 0.4, 'joueur');
}
function enterColony() {
  const P = G.p, c = W.spots.colony;
  PLANE_MODEL.visible = false; leaveVehicleVisual(); G.mode = 'walk'; G.flight = null;
  P.x = c.x; P.y = c.y; P.z = c.z; P.vx = P.vy = P.vz = 0;
  G.flags.colony = true;
  if (!W.plug.solid.off) { removeSolid(W.plug.solid); W.plug.mesh.visible = false; }
  SFX.play('win');
}

function updatePlayerModel(dt) {
  const P = G.p, m = PLAYER_MODEL;
  if (G.mode === 'walk' || G.mode === 'jar') {
    if (m.parent !== SCENE) leaveVehicleVisual();
    m.visible = G.cam3 || G.mode === 'jar';
    m.position.set(P.x, P.y, P.z);
    m.rotation.y = G.face ?? 0;
    m.scale.set(1, G.crouch ? 0.72 : 1, 1);
    animBiped(m, G.mode === 'walk' ? Math.hypot(P.vx, P.vz) : 0, dt, 0.9);
    if (!P.onGround) { m.userData.legL.rotation.x = 0.5; m.userData.legR.rotation.x = -0.3; }
    if (G.chute || (G.mode === 'walk' && P.maxFall)) { m.userData.armL.rotation.x = m.userData.armR.rotation.x = -3; }
  } else if (G.mode === 'car') {
    m.visible = true; CAR_MODEL.visible = true;
  } else m.visible = true;
  if (G.mode !== 'car') {
    const C = G.car;
    CAR_MODEL.visible = !carStowed();
    CAR_MODEL.position.set(C.x, C.y, C.z); CAR_MODEL.rotation.set(0, C.heading, 0, 'YXZ');
    if (G.mode !== 'walk' || !G.rest) SFX.engine(false, 0);
  }
}
