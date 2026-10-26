// ------------------------------ ANIMAUX : REX (chien), MOUSTACHE (chat), BUBULLE (poisson) ------------------------------
const DOG_SCHED = [[0, 7, 'patrol'], [7, 9, 'idle'], [9, 12, 'sleep'], [12, 14, 'patrol'], [14, 17, 'sleep'], [17, 19, 'idle'], [19, 22, 'sleep'], [22, 24, 'patrol']];
const dogNightLock = (h) => !!SETTINGS.dogNight && (h >= 20 || h < 8);   // paramètre « Rex dort la nuit »
const dogSchedAt = (h) => { if (dogNightLock(h)) return 'sleep'; for (const [a, b, s] of DOG_SCHED) if (h >= a && h < b) return s; return 'sleep'; };
let Dog = null, Cat = null, Fish = null;

class DogAI {
  constructor() {
    this.model = makeDogModel(); W.scene.add(this.model);
    this.x = 720; this.z = 800; this.ry = 0; this.state = 'sleep'; this.timer = 0; this.speed = 0;
    this.biteCD = 0; this.barkT = 0; this.visT = 0; this.seeing = false; this.target = null; this.unseen = 0; this.smellT = 0;
  }
  get awake() { return this.state !== 'sleep'; }
  hear(x, y, z, radius, intensity) {
    const d = dist2(x, z, this.x, this.z); if (d > radius) return;
    const k = intensity * (1 - d / radius);
    if (this.state === 'sleep') { if (k > 0.3 && !dogNightLock(G.hour)) this.alert(x, z, 14); return; }
    if (['chase', 'distracted', 'flee', 'bark'].includes(this.state)) return;
    if (k > 0.12) this.alert(x, z, 10);
  }
  alert(x, z, t) { this.state = 'alert'; this.timer = t; this.target = { x: x + rand(-25, 25), z: z + rand(-25, 25) }; this.path = null; }
  cantReach() {
    const P = G.p, c = coverInfo(P.x, P.y, P.z);
    return G.flags.inCastle || isUnreachable(P.x, P.y, P.z) || (c.low && c.deep >= 3) || P.y > 40 || (!NAV.dog.freeAt(P.x, P.z) && dist2(P.x, P.z, this.x, this.z) > 16);
  }
  canSeePlayer() {
    const P = G.p, v = G.pvis;
    if (G.flags.inBase || G.flags.inFur || G.flags.inCastle || isInvisible() || G.mode === 'cat' || G.mode === 'jar' || G.mode === 'flight' || P.y > 120) return false;
    const dx = P.x - this.x, dz = P.z - this.z, d = Math.hypot(dx, dz);
    if (d > CONFIG.dog.vision) return false;
    if (Math.abs(angWrap(Math.atan2(dx, dz) - this.ry)) > (CONFIG.dog.fov * Math.PI) / 360 && d > 45) return false;
    if (v.cover && v.low && d > 35) return false;
    if (!los(this.x, 45, this.z, P.x, P.y + 2.5, P.z)) return false;
    const k = (0.35 + 0.65 * v.light) * (v.moving ? 1 : 0.45) * (v.inCar ? 1.5 : 1) * (v.grass ? 0.5 : 1) + (d < 60 ? 0.6 : 0);
    return Math.random() < k;
  }
  smell() {
    if (isInvisible() || G.mode === 'cat') return null;
    const t = G.simT; let best = null;
    for (const p of Scent.pts) {
      if (t - p.t > 60) continue;
      const d = dist2(p.x, p.z, this.x, this.z);
      if (d < (this.state === 'track' ? 160 : CONFIG.dog.smell) && (!best || p.t > best.t)) best = p;
    }
    return best;
  }
  bark() {
    if (this.barkT > 0) return;
    this.barkT = 1.1; SFX.at('bark', this.x, 50, this.z, 1400, 1);
    emitNoise(this.x, 50, this.z, 950, 0.85, 'aboiement');
  }
  startChase() {
    if (this.state !== 'chase') { toast('Rex t\'a vu ! Fuis ou cache-toi sous un meuble bas !', 'danger'); SFX.play('alert'); G.dayStats.spotted = true; }
    this.state = 'chase'; this.unseen = 0; this.path = null;
  }
  update(dt) {
    const sch = dogSchedAt(G.hour), P = G.p;
    this.biteCD -= dt; this.barkT -= dt;
    // la nuit, avec le paramètre activé : Rex rentre dormir et ne se réveille pas
    if (dogNightLock(G.hour) && this.state !== 'sleep') { this.state = 'sleep'; this.path = null; this.target = null; }
    // joueur invisible ou sur le dos de Moustache : Rex perd sa trace et renifle autour de lui
    if ((isInvisible() || G.mode === 'cat') && ['chase', 'track', 'bark'].includes(this.state)) this.alert(this.x, this.z, 5);
    this.visT -= dt;
    if (this.visT <= 0) { this.visT = 0.25; this.seeing = this.awake && this.canSeePlayer(); }
    const free = ['idle', 'patrol', 'alert', 'track'].includes(this.state);
    if (free && this.seeing) this.startChase();
    if (free && this.state !== 'track') { this.smellT -= dt; if (this.smellT <= 0) { this.smellT = 0.4; if (this.smell()) { this.state = 'track'; this.timer = 0; this.path = null; } } }
    if (this.state === 'sleep' && dist2(P.x, P.z, this.x, this.z) < 26 && P.y < 20 && !G.flags.inBase && !G.flags.inCastle && G.mode !== 'cat' && !isInvisible() && !dogNightLock(G.hour)) this.alert(P.x, P.z, 10);
    if (this.state === 'chase' && Cat && G.cat.aff >= 60 && Cat.state !== 'ridden' && dist2(Cat.x, Cat.z, this.x, this.z) < 220) {
      this.state = 'flee'; this.timer = 6; this.path = null; this.fleeFrom = Cat; SFX.at('meow', Cat.x, 20, Cat.z, 900, 1); toast('Moustache crache sur Rex : il s\'enfuit !', 'success'); Missions.event('catScared');
    }
    const held = INV.slots[G.sel];
    if (this.state === 'chase' && G.mode === 'walk' && held && held.id === 'epee' && dist2(P.x, P.z, this.x, this.z) < 90) {
      this.state = 'flee'; this.timer = 5; this.path = null; this.fleeFrom = { x: P.x, z: P.z }; toast('Rex recule devant l’épée en diamant !', 'success');
    }
    switch (this.state) {
      case 'sleep': {
        if (dist2(this.x, this.z, 720, 800) > 15) { const r = followPath(this, NAV.dog, 720, 800, CONFIG.dog.walk, dt, 0); this.speed = r === 'moving' ? CONFIG.dog.walk : 0; }
        else this.speed = 0;
        if (sch !== 'sleep') { this.state = sch; this.path = null; }
        break;
      }
      case 'idle': {
        this.speed = 0;
        const ix = G.hour < 12 ? 735 : 470, iz = G.hour < 12 ? 760 : 640;
        if (dist2(this.x, this.z, ix, iz) > 20) { const r = followPath(this, NAV.dog, ix, iz, CONFIG.dog.walk, dt, 0); this.speed = r === 'moving' ? CONFIG.dog.walk : 0; }
        else this.ry += Math.sin(G.simT * 0.5) * dt * 0.5;
        if (sch !== 'idle') { this.state = sch; this.path = null; }
        break;
      }
      case 'patrol': {
        if (!this.target || this.timer <= 0) { const s = pick(W.dogSpots); this.target = { x: s.x, z: s.z }; this.timer = 25; this.path = null; }
        this.timer -= dt;
        const r = followPath(this, NAV.dog, this.target.x, this.target.z, CONFIG.dog.walk, dt, 0);
        this.speed = r === 'moving' ? CONFIG.dog.walk : 0;
        if (r === 'done') this.timer = Math.min(this.timer, 2);
        if (sch !== 'patrol') { this.state = sch; this.path = null; this.target = null; }
        break;
      }
      case 'alert': {
        this.timer -= dt;
        const r = followPath(this, NAV.dog, this.target.x, this.target.z, CONFIG.dog.walk * 1.3, dt, 0);
        this.speed = r === 'moving' ? CONFIG.dog.walk * 1.3 : 0;
        if (r === 'done') this.ry += dt * 2;
        if (this.timer <= 0) { this.state = sch; this.target = null; this.path = null; }
        break;
      }
      case 'track': {
        this.timer -= dt;
        if (this.timer <= 0) {
          this.timer = 0.5;
          const s = this.smell();
          if (!s) { this.alert(this.x, this.z, 6); break; }
          this.target = { x: s.x, z: s.z };
        }
        if (this.target) { const r = followPath(this, NAV.dog, this.target.x, this.target.z, CONFIG.dog.walk * 1.4, dt, 0); this.speed = r === 'moving' ? CONFIG.dog.walk * 1.4 : 0; }
        if (dist2(this.x, this.z, P.x, P.z) < 60 && this.cantReach() && !G.flags.inBase && !G.flags.inCastle) { this.state = 'bark'; this.timer = 8; this.speed = 0; toast('Rex a flairé ta cachette et aboie !', 'warn'); break; }
        if (Math.random() < dt * 0.4) SFX.at('growl', this.x, 40, this.z, 500, 0.6);
        break;
      }
      case 'chase': {
        const d = dist2(P.x, P.z, this.x, this.z);
        if (this.seeing) this.unseen = 0; else this.unseen += dt;
        if (this.unseen > 4) { this.state = 'track'; this.timer = 0; break; }
        if (this.cantReach()) {
          if (d < 90) { this.state = 'bark'; this.timer = 8; this.speed = 0; break; }
        } else if (d < 15 && P.y < 40 && this.biteCD <= 0) {
          this.biteCD = 3; this.bark(); onDogBite(this);
        }
        const r = followPath(this, NAV.dog, P.x, P.z, CONFIG.dog.run, dt, 0.4);
        this.speed = r === 'moving' ? CONFIG.dog.run : 0;
        if (Math.random() < dt * 0.8) this.bark();
        break;
      }
      case 'bark': {
        this.timer -= dt; this.speed = 0;
        this.ry = turnTo(this.ry, Math.atan2(P.x - this.x, P.z - this.z), dt * 6);
        this.bark();
        if (!this.cantReach() && this.seeing) { this.state = 'chase'; break; }
        if (this.timer <= 0) { this.state = 'idle'; this.path = null; }
        break;
      }
      case 'distracted': {
        this.timer -= dt;
        const it = this.item;
        if (it && PICKUPS.includes(it)) {
          const r = followPath(this, NAV.dog, it.x, it.z, CONFIG.dog.run * 0.9, dt, 0);
          this.speed = r === 'moving' ? CONFIG.dog.run * 0.9 : 0;
          if (dist2(it.x, it.z, this.x, this.z) < 20) { removePickup(it); this.item = null; this.timer = it.id === 'balle' ? 22 : 16; toast(it.id === 'balle' ? 'Rex joue avec la balle !' : 'Rex croque la croquette.', 'info'); }
        } else { this.speed = 0; this.ry += dt * 3; }
        if (this.timer <= 0) { this.state = sch === 'sleep' ? 'sleep' : 'idle'; this.path = null; }
        break;
      }
      case 'flee': {
        this.timer -= dt;
        const F = this.fleeFrom || Cat;
        const ax = this.x + (this.x - F.x), az = this.z + (this.z - F.z);
        const r = followPath(this, NAV.dog, ax, az, CONFIG.dog.run, dt, 0);
        this.speed = r === 'moving' ? CONFIG.dog.run : 0;
        if (this.timer <= 0) { this.state = 'idle'; this.path = null; }
        break;
      }
    }
    this.render(dt);
  }
  distract(p) {
    if (dogNightLock(G.hour)) return;
    if (dist2(p.x, p.z, this.x, this.z) > (this.awake ? 650 : 300)) return;
    this.state = 'distracted'; this.item = p; this.timer = 25; this.path = null;
    Missions.event('dogDistracted');
  }
  render(dt) {
    const m = this.model, u = m.userData;
    m.position.set(this.x, 0, this.z); m.rotation.set(0, this.ry, 0);
    if (this.state === 'sleep' && this.speed < 1) {
      m.position.y = -16;
      u.legs[0].rotation.x = u.legs[1].rotation.x = -1.4; u.legs[2].rotation.x = u.legs[3].rotation.x = 1.4;
      u.head.rotation.x = 0.35;
    } else {
      animQuad(m, this.speed, dt, 0.2);
      u.head.rotation.x = this.state === 'track' || this.state === 'alert' ? 0.55 + Math.sin(G.simT * 9) * 0.1 : this.state === 'bark' ? -0.2 : 0;
    }
    u.tail.rotation.y = this.state === 'distracted' ? Math.sin(G.simT * 18) * 0.7 : Math.sin(G.simT * 3) * 0.15;
    const mk = u.mark;
    mk.visible = ['chase', 'bark', 'track', 'alert'].includes(this.state);
    if (mk.visible) setSpriteTextOnce(mk, this.state === 'chase' || this.state === 'bark' ? '!' : '?', this.state === 'chase' || this.state === 'bark' ? '#dc2626' : '#f59e0b');
  }
}
function setSpriteTextOnce(s, txt, col) { if (s.userData.txt !== txt) { s.userData.txt = txt; setSpriteText(s, txt, col); } }

class CatAI {
  constructor() {
    this.model = makeCatModel(); W.scene.add(this.model);
    this.x = 590; this.z = 500; this.y = 3; this.ry = 0; this.state = 'nap'; this.timer = 40; this.spot = W.catSpots[0];
    this.jump = null; this.speed = 0; this.followT = 0; this.helpT = 0; this.meowT = 5;
  }
  startJump(tx, ty, tz) { this.jump = { fx: this.x, fy: this.y, fz: this.z, tx, ty, tz, t: 0, dur: 0.55 }; this.ry = Math.atan2(tx - this.x, tz - this.z); }
  leavePerch() { if (this.y > 5 && this.spot && this.spot.ax !== undefined) { this.startJump(this.spot.ax, 0, this.spot.az); return true; } return false; }
  goTo(spot) { this.spot = spot; this.state = 'goto'; this.path = null; }
  call() {
    if (this.state === 'ridden') return;
    this.followT = 60; if (!this.leavePerch()) { this.state = 'follow'; this.path = null; } else this.after = 'follow';
    SFX.at('meow', this.x, 20, this.z, 900, 1);
  }
  update(dt) {
    if (this.state === 'ridden') return;
    if (this.jump) {
      const j = this.jump; j.t += dt / j.dur; const t = Math.min(1, j.t);
      this.x = lerp(j.fx, j.tx, t); this.z = lerp(j.fz, j.tz, t); this.y = lerp(j.fy, j.ty, t) + Math.sin(t * Math.PI) * 25;
      if (t >= 1) { this.jump = null; this.y = j.ty; if (this.after) { this.state = this.after; this.after = null; this.path = null; } }
      this.render(dt); return;
    }
    const P = G.p;
    this.meowT -= dt;
    switch (this.state) {
      case 'nap': this.speed = 0; this.timer -= dt; if (G.rest && G.flags.inFur) this.timer = Math.max(this.timer, 5); if (this.timer <= 0) { if (!this.leavePerch()) this.wander(); else this.after = 'wanderNext'; } break;
      case 'wanderNext': this.wander(); break;
      case 'goto': {
        const sp = this.spot, tx = sp.ax ?? sp.x, tz = sp.az ?? sp.z;
        const r = followPath(this, NAV.cat, tx, tz, CONFIG.cat.walk, dt, 0);
        this.speed = r === 'moving' ? CONFIG.cat.walk : 0; this.y = groundAt(this.x, this.z, 3, 6);
        if (r === 'done' || !this.path) {
          if (sp.y > 5) { this.startJump(sp.x, sp.y, sp.z); this.after = sp.nap ? 'nap' : 'idle'; }
          else this.state = sp.nap ? 'nap' : 'idle';
          this.timer = sp.nap ? rand(60, 160) : rand(10, 25);
        }
        break;
      }
      case 'idle': this.speed = 0; this.timer -= dt; if (G.rest && G.flags.inFur) this.timer = Math.max(this.timer, 5); if (this.timer <= 0) { if (!this.leavePerch()) this.wander(); else this.after = 'wanderNext'; } break;
      case 'follow': {
        this.followT -= dt;
        const d = dist2(P.x, P.z, this.x, this.z);
        if (d > 28) { const r = followPath(this, NAV.cat, P.x, P.z, d > 150 ? CONFIG.cat.run : CONFIG.cat.walk * 1.4, dt, 0); this.speed = r === 'moving' ? (d > 150 ? CONFIG.cat.run : CONFIG.cat.walk * 1.4) : 0; }
        else { this.speed = 0; this.ry = turnTo(this.ry, Math.atan2(P.x - this.x, P.z - this.z), dt * 4); }
        this.y = groundAt(this.x, this.z, 3, 6);
        if (this.meowT <= 0) { this.meowT = rand(8, 16); SFX.at('meow', this.x, 20, this.z, 600, 0.6); }
        if (G.cat.aff >= 40) for (const h of HUMANS) if (h.state === 'chase' && dist2(h.x, h.z, this.x, this.z) < 420 && Math.random() < dt * 0.35) {
          this.state = 'help'; this.helpTarget = h; this.path = null; break;
        }
        if (this.followT <= 0) this.wander();
        break;
      }
      case 'help': {
        const h = this.helpTarget;
        const r = followPath(this, NAV.cat, h.x, h.z, CONFIG.cat.run, dt, 0);
        this.speed = r === 'moving' ? CONFIG.cat.run : 0; this.y = groundAt(this.x, this.z, 3, 6);
        if (dist2(h.x, h.z, this.x, this.z) < 45 || r === 'done') {
          h.distractT = 4.5; if (h.state === 'chase' || h.state === 'grab') { h.state = 'search'; h.timer = 6; h.target = { x: h.x, z: h.z }; }
          SFX.at('purr', this.x, 20, this.z, 600, 1); toast(`Moustache se frotte aux jambes de ${h.name} : file !`, 'success');
          Missions.event('catHelped'); this.state = 'follow'; this.followT = Math.max(this.followT, 15);
        }
        break;
      }
    }
    this.render(dt);
  }
  wander() {
    const opts = W.catSpots.filter((s) => s !== this.spot);
    const s = Math.random() < 0.55 ? pick(opts.filter((o) => o.nap)) : pick(opts);
    this.goTo(s);
  }
  render(dt) {
    const m = this.model, u = m.userData;
    m.position.set(this.x, this.y, this.z); m.rotation.set(0, this.ry, 0);
    if (this.state === 'nap' && !this.jump) {
      m.position.y = this.y - 8; u.legs.forEach((l, i) => (l.rotation.x = i < 2 ? -1.4 : 1.4)); u.head.rotation.x = 0.4; u.tail.rotation.x = -0.2;
    } else { animQuad(m, this.speed, dt, 0.32); u.head.rotation.x = 0; u.tail.rotation.x = -0.9 + Math.sin(G.simT * 2) * 0.15; }
  }
}

class FishAI {
  constructor() { this.model = makeFishModel(); W.scene.add(this.model); const b = W.fishBounds; this.x = (b.x0 + b.x1) / 2; this.y = (b.y0 + b.y1) / 2; this.z = (b.z0 + b.z1) / 2; this.t = { x: this.x, y: this.y, z: this.z }; this.ry = 0; }
  update(dt) {
    const b = W.fishBounds, P = G.p;
    const near = dist2(P.x, P.z, 56, 735) < 90 && P.y < 110;
    if (near) this.t = { x: b.x1 - 2, y: clamp(P.y + 30, b.y0, b.y1), z: clamp(P.z, b.z0, b.z1) };
    else if (Math.hypot(this.t.x - this.x, this.t.z - this.z) < 3 || Math.random() < dt * 0.1) this.t = { x: rand(b.x0, b.x1), y: rand(b.y0, b.y1), z: rand(b.z0, b.z1) };
    const dx = this.t.x - this.x, dy = this.t.y - this.y, dz = this.t.z - this.z, d = Math.hypot(dx, dy, dz);
    if (d > 0.5) { const sp = Math.min(d, 9 * dt); this.x += (dx / d) * sp; this.y += (dy / d) * sp; this.z += (dz / d) * sp; this.ry = turnTo(this.ry, Math.atan2(dx, dz), dt * 3); }
    else if (near) this.ry = turnTo(this.ry, Math.PI / 2, dt * 3);
    this.model.position.set(this.x, this.y, this.z); this.model.rotation.set(0, this.ry + Math.sin(G.simT * 8) * 0.12, 0);
  }
}
