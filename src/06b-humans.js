// ------------------------------ HUMAINS ------------------------------
const ACTS = {
  m_sleep: { spots: ['marc_bed'], sleep: 1 },
  m_breakfast: { spots: ['marc_breakfast', 'marc_cook', 'marc_fridge'], dwell: [25, 60] },
  m_sdb: { spots: ['marc_sdb'], dwell: [40, 80] },
  m_work: { spots: ['marc_desk', 'marc_desk', 'marc_desk', 'marc_fridge'], dwell: [60, 150] },
  m_lunch: { spots: ['marc_cook', 'marc_cook2', 'marc_breakfast', 'marc_fridge'], dwell: [20, 45] },
  m_garden: { spots: ['marc_garden1', 'marc_garden2', 'marc_garden3'], dwell: [30, 60] },
  m_dinner: { spots: ['marc_cook', 'marc_cook2', 'marc_breakfast'], dwell: [20, 40] },
  m_tv: { spots: ['marc_tv'], dwell: [100, 200] },
  l_sleep: { spots: ['lea_bed'], sleep: 1 },
  l_breakfast: { spots: ['lea_breakfast'], dwell: [40, 80] },
  l_away: { spots: ['front_door'], away: 1 },
  l_play: { spots: ['lea_rug1', 'lea_rug2', 'lea_rug3'], dwell: [20, 50] },
  l_lego: { spots: ['lea_lego'], dwell: [60, 120] },
  l_lunch: { spots: ['lea_breakfast'], dwell: [40, 80] },
  l_garden: { spots: ['lea_garden1', 'lea_garden2', 'lea_garden3'], dwell: [15, 35] },
  l_dinner: { spots: ['lea_breakfast'], dwell: [60, 100] },
  l_bath: { spots: ['lea_bath'], dwell: [100, 200] },
  m_party: { spots: ['marc_tv', 'marc_tv', 'lea_rug3'], dwell: [40, 90] },
  l_party: { spots: ['lea_rug1', 'lea_rug2', 'lea_rug3'], dwell: [15, 35] },
};
const SCHED = {
  marc: [[0, 8, 'm_sleep'], [8, 8.75, 'm_breakfast'], [8.75, 9.25, 'm_sdb'], [9.25, 12, 'm_work'], [12, 13, 'm_lunch'], [13, 16.5, 'm_work'], [16.5, 18, 'm_garden'], [18, 19, 'm_dinner'], [19, 20, 'm_tv'], [20, 24, 'm_sleep']],
  lea: [[0, 8, 'l_sleep'], [8, 8.5, 'l_breakfast'], [8.5, 16, 'l_away'], [16, 17, 'l_lego'], [17, 17.5, 'l_play'], [17.5, 18.5, 'l_garden'], [18.5, 19.25, 'l_dinner'], [19.25, 20, 'l_bath'], [20, 24, 'l_sleep']],
  // week-end (jours 6 et 7 de chaque semaine) : pas d'école
  lea_we: [[0, 8.5, 'l_sleep'], [8.5, 9, 'l_breakfast'], [9, 11.5, 'l_lego'], [11.5, 12.5, 'l_garden'], [12.5, 13.25, 'l_lunch'], [13.25, 15, 'l_play'], [15, 17, 'l_lego'], [17, 17.5, 'l_play'], [17.5, 18.5, 'l_garden'], [18.5, 19.25, 'l_dinner'], [19.25, 20, 'l_bath'], [20, 24, 'l_sleep']],
};
const ACT_LABEL = {
  m_sleep: 'dort dans la chambre', m_breakfast: 'prend son petit-déjeuner dans la cuisine', m_sdb: 'se prépare dans la salle de bain', m_work: 'travaille dans le bureau',
  m_lunch: 'déjeune dans la cuisine', m_garden: 'jardine', m_dinner: 'prépare le dîner', m_tv: 'regarde la télé au salon',
  l_sleep: 'dort dans la chambre', l_breakfast: 'prend son petit-déjeuner', l_away: "est à l'école", l_play: 'joue sur le tapis du salon', l_lego: 'construit son château Lego dans la chambre', l_lunch: 'déjeune dans la cuisine', l_garden: 'joue dans le jardin', l_dinner: 'dîne dans la cuisine', l_bath: 'prend son bain',
  m_party: 'fait la fête au salon', l_party: 'fait la fête au salon',
};
const isWeekend = (d) => d % 7 === 6 || d % 7 === 0;
const schedTable = (who) => (who === 'lea' && isWeekend(G.day || 1) ? SCHED.lea_we : SCHED[who]);
const schedAt = (who, h) => {
  const party = typeof eventParty === 'function' ? eventParty(h) : false;
  if (party) return who === 'marc' ? 'm_party' : 'l_party';
  const T = schedTable(who);
  for (const [a, b, act] of T) if (h >= a && h < b) return act;
  return T[0][2];
};

const HUMANS = [];
class Human {
  constructor(id, name, look, vision) {
    this.id = id; this.name = name; this.s = look.scale; this.vision = vision;
    this.model = makeHumanModel(look); W.scene.add(this.model);
    this.x = 0; this.z = 0; this.ry = 0; this.state = 'routine'; this.sus = 0; this.act = null;
    this.spot = null; this.pose = 'stand'; this.dwell = 0; this.speed = 0; this.timer = 0; this.lastSeen = null;
    this.unseen = 0; this.visT = 0; this.grabT = 0; this.distractT = 0; this.bend = 0; this.lastStep = 0; this.seeing = 0; this.awakeT = 0;
    this.mem = 0; this.memFull = 0;
    HUMANS.push(this);
  }
  get eyeY() { return this.pose === 'sit' ? (this.spot && this.spot.y ? this.spot.y : 45) + 60 * this.s : this.pose === 'floor' || this.pose === 'crouch' ? 70 * this.s : 162 * this.s; }
  get asleep() { return this.act && ACTS[this.act].sleep && this.pose === 'sleep' && this.awakeT <= 0; }
  get away() { return this.pose === 'away'; }
  placeAt(spotKey) { const sp = W.spots[spotKey]; this.x = sp.ax; this.z = sp.az; }
  standUp() {
    if (this.pose !== 'stand' && this.pose !== 'away' && this.spot) { this.x = this.spot.ax; this.z = this.spot.az; }
    if (this.pose === 'away') { const fd = W.spots.front_door; this.x = fd.ax; this.z = fd.az; }
    this.pose = 'stand'; this.path = null;
  }
  setActivity(act, instant = false) {
    this.act = act; this.spotKey = null; this.dwell = 0;
    this.pickSpot();
    if (instant) { this.standUp(); this.x = this.spot.ax; this.z = this.spot.az; this.arrive(); }
  }
  pickSpot() {
    const A = ACTS[this.act];
    const key = A.spots.length > 1 ? pick(A.spots.filter((k) => k !== this.spotKey)) : A.spots[0];
    this.spotKey = key; this.spot = W.spots[key]; this.path = null; this.arrived = false;
  }
  arrive() {
    const A = ACTS[this.act], sp = this.spot;
    this.arrived = true;
    this.dwell = A.dwell ? rand(A.dwell[0], A.dwell[1]) : 1e9;
    if (A.away) { this.pose = 'away'; return; }
    this.pose = A.sleep ? 'sleep' : sp.pose || 'stand';
    if (sp.x !== undefined) { this.x = sp.x; this.z = sp.z; }
    if (sp.ry !== undefined) this.ry = sp.ry;
    if (this.act === 'l_lego' && G.started) { const r = roomAt(G.p.x, G.p.z); if (r && r.id === 'chambre') toast('🏰 Léa s’assoit devant son château Lego et commence à jouer.', 'info'); }
  }
  visibilityOfPlayer() {
    const P = G.p, pv = G.pvis;
    const ey = this.eyeY, px = P.x, py = P.y + 2.5, pz = P.z;
    const dx = px - this.x, dz = pz - this.z, dy = py - ey, d = Math.hypot(dx, dy, dz);
    const range = this.vision * (G.mood > 0 ? 0.8 : 1);
    if (d > range) return 0;
    const fwd = Math.atan2(dx, dz), da = Math.abs(angWrap(fwd - this.ry));
    if (da > (CONFIG.human.fov * Math.PI) / 360 && d > 70) return 0;
    if (!los(this.x, ey, this.z, px, py, pz)) return 0;
    let v = Math.pow(1 - d / range, 0.6);
    v *= 0.25 + 0.75 * pv.light;
    v *= pv.crouch ? 0.5 : 1;
    v *= pv.moving ? 1.3 : 0.55;
    if (pv.inCar) v *= 1.6;
    if (pv.onCat) v *= 0.55;
    if (pv.elevated) v *= 1.5;
    if (pv.cover) v *= pv.low ? 0.25 : 0.7;
    if (pv.grass) v *= 0.45;
    if (this.state === 'chase' || this.state === 'search') v *= 1.8;
    if (huntActive()) v *= 1.8;
    return clamp(v, 0, 1.5);
  }
  hear(x, y, z, radius, intensity, src) {
    if (this.away) return;
    // Léa, penchée sur son château, entend tout ce qui s'y passe
    const castle = this.act === 'l_lego' && this.arrived && G.flags.inCastle && src !== 'aboiement';
    if (castle) { radius *= 1.5; intensity *= 2.4; }
    // traces de crème repérées : ils tendent l'oreille au moindre pas
    if (huntActive() && src !== 'aboiement') { radius *= 1.8; intensity *= 2; }
    const d = Math.hypot(x - this.x, z - this.z);
    if (d > radius) return;
    const k = intensity * (1 - d / radius);
    if (this.asleep) {
      if (k > 0.3 && d < 260) { this.awakeT = 25; this.investigate(x, z, 0.5); toast(`${this.name} s’est réveillé à cause du bruit !`, 'danger'); }
      return;
    }
    if (this.state === 'chase' || this.state === 'grab') return;
    this.sus = Math.min(0.95, this.sus + k * 0.6);
    if (this.id === 'lea' && G.flags.inCastle && this.sus >= 0.35 && G.simT > (G.fx.leaCastleT || 0)) { G.fx.leaCastleT = G.simT + 30; toast('Léa : « Hé… Il y a quelqu’un dans mon château ? »', 'warn'); }
    if (this.sus >= 0.35 || src === 'aboiement') this.investigate(x, z, this.sus);
  }
  investigate(x, z, sus) {
    if (this.state === 'chase' || this.state === 'grab') return;
    if (this.state !== 'investigate') { SFX.at('sus', this.x, 100, this.z, 900, 0.8); setSpriteText(this.model.userData.mark, '?', '#f59e0b'); }
    this.standUp(); this.state = 'investigate'; this.sus = Math.max(this.sus, sus);
    this.target = { x: x + rand(-20, 20), z: z + rand(-20, 20) }; this.timer = 0; this.path = null;
  }
  startChase() {
    if (this.state !== 'chase') {
      SFX.play('alert'); setSpriteText(this.model.userData.mark, '!', '#dc2626');
      G.stats.spotted++; G.dayStats.spotted = true; toast(`${this.name} t'a repéré !`, 'danger');
    }
    this.standUp(); this.state = 'chase'; this.sus = 1; this.unseen = 0; this.path = null;
  }
  backToRoutine(msg) {
    this.state = 'routine'; this.sus = Math.min(this.sus, 0.2); this.path = null; this.arrived = false; this.mem = 0;
    if (msg) toast(msg, 'info');
  }
  update(dt) {
    const h = G.hour, act = schedAt(this.id, h);
    if (this.awakeT > 0) this.awakeT -= dt;
    if (act !== this.act && (this.state === 'routine')) { this.standUp(); this.setActivity(act); }
    if (this.distractT > 0) { this.distractT -= dt; this.speed = 0; this.ry = turnTo(this.ry, Math.atan2(Cat.x - this.x, Cat.z - this.z), dt * 4); this.render(dt); return; }
    // vision
    this.visT -= dt;
    // pendant une recherche (traces de crème), une excellente cachette protège seulement si tu ne bouges pas
    const stillHidden = huntActive() && G.hideHere >= 80 && !(G.pvis && G.pvis.moving);
    const hidden = G.flags.inBase || G.flags.inFur || G.flags.inCastle || G.mode === 'cat' || isInvisible() || stillHidden;
    if (this.visT <= 0 && !this.asleep && !this.away && G.mode !== 'jar' && !hidden) {
      this.visT = 0.15;
      this.seeing = this.visibilityOfPlayer();
      if (this.seeing > 0.02) {
        this.sus = Math.min(1.2, this.sus + this.seeing * CONFIG.human.suspicionRate * 0.15 * (G.mood > 0 ? 0.7 : 1));
        this.lastSeen = { x: G.p.x, z: G.p.z }; this.unseen = 0;
        if (this.sus >= 0.35) {
          const d = Math.hypot(G.p.x - this.x, G.p.z - this.z), H = CONFIG.human;
          const m = clamp(H.memNear - (H.memNear - H.memFar) * (d / this.vision), H.memFar, H.memNear);
          if (m >= this.mem) { this.mem = m; this.memFull = m; }
        }
        if (this.sus >= 1) { if (this.state !== 'chase' && this.state !== 'grab' && this.state !== 'reach') this.startChase(); }
        else if (this.sus >= 0.35 && this.state === 'routine') this.investigate(G.p.x, G.p.z, this.sus);
      }
    } else if (this.asleep || this.away || G.mode === 'jar' || hidden) this.seeing = 0;
    if (this.seeing <= 0.02 && this.mem > 0) {
      this.mem = Math.max(0, this.mem - dt * (INV.count('couronne') ? 2 : 1));
      if (this.mem === 0 && (this.state === 'search' || this.state === 'investigate')) this.backToRoutine(`${this.name} t'a oublié.`);
    }
    if (this.seeing <= 0.02 && this.state !== 'chase') this.sus = Math.max(0, this.sus - CONFIG.human.decay * dt);
    switch (this.state) {
      case 'routine': this.routine(dt); break;
      case 'investigate': this.doInvestigate(dt); break;
      case 'chase': this.chase(dt); break;
      case 'grab': this.grab(dt); break;
      case 'reach': this.reach(dt); break;
      case 'search': this.search(dt); break;
    }
    this.render(dt);
  }
  routine(dt) {
    if (!this.spot) this.setActivity(schedAt(this.id, G.hour));
    if (!this.arrived) {
      if (this.pose === 'away') { this.standUp(); }
      const r = followPath(this, NAV.human, this.spot.ax, this.spot.az, CONFIG.human.walk * (this.s < 1 ? 1.1 : 1), dt, 0);
      this.speed = r === 'moving' ? CONFIG.human.walk : 0;
      if (!this.path) { this.x = this.spot.ax; this.z = this.spot.az; this.speed = 0; this.arrive(); }
      else if (r === 'done') { this.speed = 0; this.arrive(); }
    } else {
      this.speed = 0;
      if (this.spot.ry !== undefined && this.pose === 'stand') this.ry = turnTo(this.ry, this.spot.ry, dt * 3);
      this.dwell -= dt;
      if (this.dwell <= 0 && ACTS[this.act].spots.length > 1) { this.standUp(); this.pickSpot(); }
    }
  }
  doInvestigate(dt) {
    const r = followPath(this, NAV.human, this.target.x, this.target.z, CONFIG.human.walk * 0.7, dt, 0);
    this.speed = r === 'moving' ? CONFIG.human.walk * 0.7 : 0;
    if (r === 'done' || !this.path) {
      this.timer += dt; this.ry += Math.sin(G.simT * 1.7) * dt * 1.5;
      if (this.timer > 5 && this.mem <= 0) this.backToRoutine();
    }
    if (this.sus < 0.15 && this.mem <= 0) this.backToRoutine();
  }
  chase(dt) {
    const P = G.p;
    if (this.seeing > 0.02) this.lastSeen = { x: P.x, z: P.z };
    else this.unseen += dt;
    if (this.unseen > 3) { this.state = 'search'; this.timer = 4; this.path = null; this.target = { ...this.lastSeen }; return; }
    const tgt = this.lastSeen || { x: P.x, z: P.z };
    const d = Math.hypot(P.x - this.x, P.z - this.z);
    const sp = CONFIG.human.chase * (this.s < 1 ? 1.08 : 1);
    if (this.seeing > 0.02 && d < CONFIG.human.grabRange * this.s && P.y < 150 * this.s + 20) {
      if (isUnreachable(P.x, P.y, P.z)) { this.state = 'reach'; this.timer = 5; toast(`${this.name} essaie de t'attraper… mais tu es hors de portée !`, 'warn'); return; }
      this.state = 'grab'; this.grabT = CONFIG.human.grabTime; this.speed = 0; SFX.play('whoosh'); return;
    }
    if (this.seeing > 0.02 && NAV.human.line(this.x, this.z, P.x, P.z) && d > 30) {
      const dx = P.x - this.x, dz = P.z - this.z;
      this.x += (dx / d) * sp * dt; this.z += (dz / d) * sp * dt; this.ry = turnTo(this.ry, Math.atan2(dx, dz), dt * 10); this.path = null; this.speed = sp;
    } else {
      const r = followPath(this, NAV.human, tgt.x, tgt.z, sp, dt, 0.5);
      this.speed = r === 'moving' ? sp : 0;
      if (r === 'done' && this.seeing <= 0.02) this.unseen += dt * 2;
    }
  }
  grab(dt) {
    const P = G.p;
    this.grabT -= dt; this.speed = 0;
    this.ry = turnTo(this.ry, Math.atan2(P.x - this.x, P.z - this.z), dt * 8);
    if (this.grabT <= 0) {
      const d = Math.hypot(P.x - this.x, P.z - this.z);
      if (d < CONFIG.human.grabRange * this.s + 4 && P.y < 150 * this.s + 20 && !isUnreachable(P.x, P.y, P.z) && G.mode !== 'jar' && G.mode !== 'cat' && !isInvisible()) { onCaptured(this); return; }
      toast(`Raté ! ${this.name} t'a manqué de peu.`, 'warn');
      this.state = 'chase'; this.unseen = 0;
    }
  }
  reach(dt) {
    this.timer -= dt; this.speed = 0;
    if (!isUnreachable(G.p.x, G.p.y, G.p.z) && this.seeing > 0.02) { this.state = 'chase'; return; }
    if (this.timer <= 0) { this.state = 'search'; this.timer = 6; this.target = { x: this.x + rand(-80, 80), z: this.z + rand(-80, 80) }; this.path = null; }
  }
  search(dt) {
    this.timer -= dt;
    const r = followPath(this, NAV.human, this.target.x, this.target.z, CONFIG.human.walk * 0.8, dt, 0);
    this.speed = r === 'moving' ? CONFIG.human.walk * 0.8 : 0;
    if (r === 'done' || !this.path) {
      this.ry += dt * 1.2;
      if (Math.random() < dt * 0.5 && this.lastSeen) this.target = { x: this.lastSeen.x + rand(-120, 120), z: this.lastSeen.z + rand(-120, 120) };
    }
    if (this.sus >= 1 && this.seeing > 0.02) { this.startChase(); return; }
    if (this.timer <= 0 && this.mem <= 0) this.backToRoutine(`${this.name} abandonne les recherches.`);
  }
  render(dt) {
    const m = this.model, u = m.userData, s = this.s;
    m.visible = !this.away;
    m.rotation.set(0, 0, 0);
    let bendT = 0, armT = null;
    if (this.state === 'grab') { bendT = 1.0; armT = -1.5; }
    else if (this.state === 'reach') { bendT = 1.25; armT = -1.7; }
    this.bend = lerp(this.bend, bendT, Math.min(1, dt * 8));
    u.up.rotation.x = this.bend;
    if (this.pose === 'sleep') {
      const sp = this.spot; m.position.set(sp.x, sp.y, sp.z); m.rotation.set(-Math.PI / 2, 0, 0);
      u.legL.rotation.x = u.legR.rotation.x = 0; u.armL.rotation.x = u.armR.rotation.x = 0;
    } else if (this.pose === 'sit') {
      m.position.set(this.x, (this.spot.y || 45) + 3 - u.L, this.z); m.rotation.y = this.ry;
      u.legL.rotation.x = u.legR.rotation.x = -Math.PI / 2; u.armL.rotation.x = u.armR.rotation.x = -0.5;
    } else if (this.pose === 'floor' || this.pose === 'crouch') {
      m.position.set(this.x, 22 * s - u.L, this.z); m.rotation.y = this.ry;
      u.legL.rotation.x = u.legR.rotation.x = -Math.PI / 2; u.armL.rotation.x = -0.8 + Math.sin(G.simT * 3) * 0.3; u.armR.rotation.x = -0.6;
    } else {
      m.position.set(this.x, 0, this.z); m.rotation.y = this.ry;
      animBiped(m, this.speed, dt, 0.09 / s);
      if (armT !== null) { u.armL.rotation.x = armT; u.armR.rotation.x = armT; }
      if (this.speed > 1) {
        const ph = Math.floor(u.phase / Math.PI);
        if (ph !== this.lastStep) { this.lastStep = ph; SFX.at('giant', this.x, 0, this.z, 700, 0.9 * s); const d = Math.hypot(G.p.x - this.x, G.p.z - this.z); if (d < 220) G.shake = Math.max(G.shake, (1 - d / 220) * 0.6); }
      }
    }
    const mk = u.mark;
    mk.visible = !this.away && (this.state === 'investigate' || this.state === 'chase' || this.state === 'grab' || this.state === 'search' || this.state === 'reach');
    if (mk.visible) mk.position.y = (this.pose === 'sit' ? u.L + 75 * s : 112 * s) + Math.sin(G.simT * 6) * 2;
  }
}
