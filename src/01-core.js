// =====================================================================
//  L'AVENTURE LÉGENDAIRE — survie à 5 cm.  1 unité = 1 cm.  Y = haut, X = est, Z = sud.
// =====================================================================

// ------------------------------ CONFIG (équilibrage) ------------------------------
const CONFIG = {
  timeScale: 72,                 // secondes de jeu par seconde réelle → 1 jour = 20 min
  startDay: 1, startHour: 9.5,
  gravity: 900,
  player: {
    radius: 1.2, height: 5, crouchHeight: 3.4, eye: 4.3, crouchEye: 2.7,
    walk: 32, sprint: 62, crouchSpeed: 16, jumpHeight: 22, step: 2.2, gravScale: 0.7, coyote: 0.15, jumpBuffer: 0.2,
    fallSafe: 60, fallDmg: 0.7, reach: 16, buildReach: 34,
  },
  // Souffle 💨 : 20 s de course, recharge complète en 8 s (après 1 s de pause), on recourt dès 30 %
  breath: { runSec: 20, refillSec: 8, delay: 1, resume: 30 },
  car: {
    maxSpeed: 230, turbo: 1.22, accel: 300, brake: 600, reverse: 80, drag: 0.55,
    grip: 10, driftGrip: 1.4, radius: 4.0, height: 4.8, step: 2.6, steer: 3.1, grass: 0.5,
  },
  stats: {
    // pertes en % par HEURE DE JEU (1 h de jeu = 50 s réelles)
    foodPerHour: 100 / 48, energyPerHour: 50 / 18,   // Nourriture : 100 % → 0 % en 2 jours de jeu
    low: 15,                     // Nourriture : écran bleu · énergie : ralenti
    jumpEnergy: 0.35,            // par saut (courir ne fatigue plus : c'est le Souffle qui baisse)
    regen: 1 / 8, starve: 1 / 3, dehydrate: 1 / 2,  // par seconde réelle
  },
  rest: { restAccel: 10, sleepAccel: 60, restGain: 12, sleepGain: 24 },   // gains d'énergie par heure de jeu
  capture: { baseRisk: 0.35, maxPerDay: 3 },
  human: { walk: 95, chase: 118, vision: 720, fov: 110, suspicionRate: 1.25, decay: 0.22, grabRange: 58, grabTime: 0.9, memNear: 15, memFar: 4 },
  dog: { walk: 65, run: 145, vision: 330, fov: 150, smell: 45, scentLife: 90, biteDmg: 18 },
  // chevauchée : affection 20 en mode normal (un futur mode difficile pourra exiger plus, par ex. 60 ou 80)
  cat: { walk: 50, run: 150, rideWalk: 70, rideRun: 150, rideTime: 90, rideRest: 60, rideMin: 15, rideJump: 130, rideAff: 20 },
  invSize: 25, hotbar: 5, chestSize: 50, stack: 10,
  invisMinutes: 240,             // un Cristal d'ombre = 4 h de jeu d'invisibilité
  cube: 10, toastMs: 10000,
};

// ------------------------------ UTILITAIRES ------------------------------
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const angWrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const fmtClock = (mins) => {
  const h = Math.floor(mins / 60) % 24, m = Math.floor(mins % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
};
const fmtDist = (cm) => (cm >= 100 ? (cm / 100).toFixed(1).replace('.', ',') + ' m' : Math.round(cm) + ' cm');
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ------------------------------ AUDIO PROCÉDURAL ------------------------------
const SFX = {
  ctx: null, master: null, vol: 0.7, nb: null, listener: { x: 0, y: 0, z: 0 }, eng: null,
  init() {
    if (this.ctx) { this.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.vol;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.nb = b;
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.value = v; },
  tone(f, d, type = 'sine', v = 0.2, f2 = null, delay = 0) {
    const c = this.ctx; if (!c || v <= 0.0005) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.03);
  },
  noise(d, freq = 1000, v = 0.2, type = 'lowpass', delay = 0, q = 1) {
    const c = this.ctx; if (!c || v <= 0.0005) return;
    const t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.nb;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t, Math.random() * 0.5); s.stop(t + d + 0.03);
  },
  play(name, v = 1) {
    if (!this.ctx) return;
    const S = this;
    switch (name) {
      case 'pickup': S.tone(660, 0.08, 'square', 0.07 * v); S.tone(990, 0.1, 'square', 0.06 * v, null, 0.07); break;
      case 'eat': for (let i = 0; i < 3; i++) S.noise(0.06, 2500, 0.16 * v, 'bandpass', i * 0.09, 2); break;
      case 'crunch': for (let i = 0; i < 5; i++) S.noise(0.05, 3200, 0.22 * v, 'bandpass', i * 0.07, 1.5); break;
      case 'drink': S.tone(520, 0.12, 'sine', 0.15 * v, 260); S.tone(440, 0.12, 'sine', 0.12 * v, 210, 0.15); break;
      case 'step': S.noise(0.03, 3500, 0.025 * v, 'highpass'); break;
      case 'giant': S.noise(0.28, 140, 0.55 * v, 'lowpass'); S.tone(52, 0.22, 'sine', 0.3 * v, 34); break;
      case 'bark':
        S.tone(330, 0.09, 'square', 0.17 * v, 180); S.noise(0.1, 700, 0.25 * v, 'bandpass', 0, 3);
        S.tone(310, 0.1, 'square', 0.15 * v, 170, 0.17); S.noise(0.1, 650, 0.2 * v, 'bandpass', 0.17, 3); break;
      case 'growl': S.tone(90, 0.6, 'sawtooth', 0.08 * v, 70); break;
      case 'meow': S.tone(620, 0.18, 'triangle', 0.1 * v, 900); S.tone(900, 0.28, 'triangle', 0.1 * v, 480, 0.17); break;
      case 'purr': for (let i = 0; i < 7; i++) S.noise(0.12, 170, 0.14 * v, 'lowpass', i * 0.15); break;
      case 'alert': S.tone(880, 0.12, 'square', 0.1 * v); S.tone(1245, 0.25, 'square', 0.1 * v, null, 0.1); break;
      case 'sus': S.tone(480, 0.28, 'triangle', 0.1 * v, 820); break;
      case 'capture': S.tone(600, 0.25, 'sawtooth', 0.11 * v, 300); S.tone(420, 0.35, 'sawtooth', 0.11 * v, 140, 0.22); break;
      case 'craft': for (let i = 0; i < 3; i++) S.noise(0.05, 1800, 0.2 * v, 'bandpass', i * 0.12, 4); S.tone(880, 0.15, 'triangle', 0.08 * v, null, 0.4); break;
      case 'bubble': for (let i = 0; i < 4; i++) S.tone(300 + i * 120, 0.07, 'sine', 0.09 * v, 600 + i * 150, i * 0.08); break;
      case 'hic': S.tone(700, 0.08, 'square', 0.14 * v, 1150); break;
      case 'thud': S.noise(0.14, 300, 0.3 * v, 'lowpass'); break;
      case 'place': S.noise(0.05, 900, 0.25 * v, 'bandpass', 0, 2); S.tone(220, 0.06, 'square', 0.05 * v); break;
      case 'break': S.noise(0.12, 1200, 0.25 * v, 'bandpass', 0, 1); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => S.tone(f, 0.3, 'triangle', 0.12 * v, null, i * 0.12)); break;
      case 'quest': [659, 784, 988].forEach((f, i) => S.tone(f, 0.18, 'triangle', 0.1 * v, null, i * 0.1)); break;
      case 'click': S.tone(1000, 0.03, 'square', 0.04 * v); break;
      case 'error': S.tone(200, 0.15, 'square', 0.07 * v, 150); break;
      case 'hurt': S.tone(320, 0.16, 'sawtooth', 0.14 * v, 120); break;
      case 'door': S.noise(0.35, 380, 0.22 * v, 'lowpass'); S.tone(140, 0.3, 'triangle', 0.07 * v, 90); break;
      case 'whoosh': S.noise(0.5, 800, 0.2 * v, 'bandpass', 0, 0.7); break;
      case 'splash': S.noise(0.2, 1500, 0.18 * v, 'highpass'); break;
      case 'jar': S.tone(1400, 0.08, 'sine', 0.08 * v); S.noise(0.06, 4000, 0.07 * v, 'highpass'); break;
      case 'tick': S.tone(1800, 0.02, 'square', 0.03 * v); break;
      case 'oink': S.tone(320, 0.12, 'square', 0.1 * v, 210); S.noise(0.1, 500, 0.12 * v, 'bandpass', 0.02, 4); S.tone(300, 0.1, 'square', 0.08 * v, 200, 0.16); break;
      case 'hiss': S.noise(1.6, 5000, 0.12 * v, 'highpass'); break;
      case 'fuse': for (let i = 0; i < 10; i++) S.noise(0.04, 6000, 0.08 * v, 'highpass', i * 0.22); break;
      case 'boom': S.noise(1.2, 220, 0.7 * v, 'lowpass'); S.tone(70, 0.9, 'sine', 0.45 * v, 30); S.noise(0.4, 2500, 0.25 * v, 'bandpass', 0.05, 0.6); break;
      case 'melody': [392, 523, 659, 784, 659, 523, 587, 698, 880, 698, 587, 494, 523].forEach((f, i) => S.tone(f, 0.26, 'square', 0.05 * v, null, i * 0.3)); break;
      case 'cough': S.noise(0.12, 900, 0.25 * v, 'bandpass', 0, 1.5); S.noise(0.14, 700, 0.22 * v, 'bandpass', 0.2, 1.5); break;
      case 'crash': S.noise(0.6, 4500, 0.35 * v, 'highpass'); [2200, 3100, 1700, 2600].forEach((f, i) => S.tone(f, 0.25, 'sine', 0.06 * v, null, i * 0.05)); S.noise(0.3, 300, 0.3 * v, 'lowpass'); break;
      case 'party': [523, 523, 587, 523, 698, 659].forEach((f, i) => S.tone(f, 0.3, 'triangle', 0.08 * v, null, i * 0.32)); break;
      case 'teleport': S.tone(200, 0.5, 'sawtooth', 0.06 * v, 1200); S.noise(0.5, 1500, 0.1 * v, 'bandpass', 0, 2); break;
    }
  },
  at(name, x, y, z, range, v = 1) {
    const d = Math.hypot(x - this.listener.x, y - this.listener.y, z - this.listener.z);
    if (d > range) return;
    this.play(name, v * (1 - d / range));
  },
  engine(on, s01) {
    if (!this.ctx) return;
    if (!this.eng) {
      const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 600; g.gain.value = 0;
      o.connect(f); f.connect(g); g.connect(this.master); o.start();
      this.eng = { o, f, g };
    }
    const t = this.ctx.currentTime;
    this.eng.o.frequency.setTargetAtTime(45 + 150 * s01, t, 0.05);
    this.eng.f.frequency.setTargetAtTime(400 + 900 * s01, t, 0.05);
    this.eng.g.gain.setTargetAtTime(on ? 0.035 + 0.05 * s01 : 0, t, 0.08);
  },
};

// ------------------------------ ENTRÉES ------------------------------
const Input = {
  keys: new Set(), dx: 0, dy: 0, locked: false, dragging: false, canvas: null,
  h: { key: null, mousedown: null, wheel: null, lock: null },
  init(canvas) {
    this.canvas = canvas;
    addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (this.h.key) this.h.key(e);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      if (this.h.lock) this.h.lock(this.locked);
    });
    document.addEventListener('mousemove', (e) => {
      if (this.locked || this.dragging) { this.dx += e.movementX || 0; this.dy += e.movementY || 0; }
    });
    canvas.addEventListener('mousedown', (e) => { if (this.h.mousedown) this.h.mousedown(e); });
    addEventListener('mouseup', () => { this.dragging = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); if (this.h.wheel) this.h.wheel(e); }, { passive: false });
  },
  down(...codes) { for (const c of codes) if (this.keys.has(c)) return true; return false; },
  lock() {
    try { const r = this.canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* pointer lock indisponible */ }
  },
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); },
  take() { const r = { dx: this.dx, dy: this.dy }; this.dx = 0; this.dy = 0; return r; },
};
