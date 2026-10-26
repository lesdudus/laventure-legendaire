// ------------------------------ PHYSIQUE ------------------------------
let _groundRamp = false, _groundRampObj = null;
function groundAt(x, z, r, yMax, rampExtra = 0) {
  let g = -50; _groundRamp = false; _groundRampObj = null;
  for (const s of querySolids(x - r, z - r, x + r, z + r)) if (s.y1 <= yMax + 0.001 && s.y1 > g) g = s.y1;
  for (const R of RAMPS) {
    const h = rampAt(R, x, z);
    if (h !== null && h <= yMax + rampExtra + 0.001 && h > g) { g = h; _groundRamp = true; _groundRampObj = R; }
  }
  return g;
}
function ceilingAt(x, z, r, fromY) {
  let c = 1e9;
  for (const s of querySolids(x - r, z - r, x + r, z + r)) if (s.y0 >= fromY - 0.05 && s.y0 < c) c = s.y0;
  return c;
}

// Contrôleur de personnage : cylindre (rayon r, hauteur h) contre AABB
function resolveBody(b) {
  const list = querySolids(b.x - b.r, b.z - b.r, b.x + b.r, b.z + b.r);
  for (const s of list) {
    if (s.y1 <= b.y + b.step || s.y0 >= b.y + b.h) continue;
    if (b.ignore && b.ignore(s)) continue;
    const cx = clamp(b.x, s.x0, s.x1), cz = clamp(b.z, s.z0, s.z1);
    const dx = b.x - cx, dz = b.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= b.r * b.r) continue;
    if (d2 > 1e-9) {
      const d = Math.sqrt(d2), nx = dx / d, nz = dz / d;
      b.x += nx * (b.r - d); b.z += nz * (b.r - d);
      const vn = b.vx * nx + b.vz * nz;
      if (vn < 0) { b.vx -= vn * nx; b.vz -= vn * nz; b.impact = Math.max(b.impact || 0, -vn); }
    } else {
      const p = [b.x - s.x0, s.x1 - b.x, b.z - s.z0, s.z1 - b.z], m = Math.min(...p);
      if (m === p[0]) { b.x = s.x0 - b.r; b.vx = Math.min(b.vx, 0); }
      else if (m === p[1]) { b.x = s.x1 + b.r; b.vx = Math.max(b.vx, 0); }
      else if (m === p[2]) { b.z = s.z0 - b.r; b.vz = Math.min(b.vz, 0); }
      else { b.z = s.z1 + b.r; b.vz = Math.max(b.vz, 0); }
    }
  }
}

function moveBody(b, dt) {
  b.impact = 0;
  const sp = Math.max(Math.abs(b.vx), Math.abs(b.vz)) * dt;
  const n = Math.min(12, Math.max(1, Math.ceil(sp / (b.r * 0.7))));
  for (let i = 0; i < n; i++) { b.x += (b.vx * dt) / n; b.z += (b.vz * dt) / n; resolveBody(b); }
  // intégration exacte sous gravité constante : la hauteur du saut ne dépend plus du nombre d'images/s
  const vy0 = b.vy;
  b.vy -= CONFIG.gravity * (b.grav ?? 1) * dt;
  if (b.maxFall) b.vy = Math.max(b.vy, -b.maxFall);
  const prevY = b.y;
  b.y += (vy0 + b.vy) * 0.5 * dt;
  if (b.vy > 0) {
    const c = ceilingAt(b.x, b.z, b.r * 0.8, prevY + b.h);
    if (b.y + b.h > c) { b.y = Math.max(prevY, c - b.h); b.vy = 0; }
  }
  // sur une rampe raide à grande vitesse, on peut monter plus que « step » en une image
  const climb = b.onGround ? Math.hypot(b.vx, b.vz) * dt * 0.6 : 0;
  const g = groundAt(b.x, b.z, b.r * 0.7, Math.max(prevY, b.y) + b.step, climb);
  const onRamp = _groundRamp, rampObj = _groundRampObj, was = b.onGround;
  b.landed = 0;
  if (b.y <= g + 0.02) {
    if (!was) b.landed = Math.max(0.0001, (b.airTop ?? prevY) - g);
    b.groundVel = was ? (g - (b.lastG ?? g)) / dt : 0;
    b.y = g; b.vy = 0; b.onGround = true; b.lastG = g; b.onRamp = onRamp; b.ramp = rampObj;
  } else if (was && b.vy <= 0 && b.y - g <= b.step * 0.9 && !(b.launch && b.onRamp && b.groundVel > 15)) {
    b.groundVel = (g - (b.lastG ?? g)) / dt;
    b.y = g; b.vy = 0; b.onGround = true; b.lastG = g; b.onRamp = onRamp; b.ramp = rampObj;
  } else {
    if (was) { b.airTop = b.y; b.leftRamp = b.ramp; if (b.launch && b.onRamp && b.groundVel > 15) b.vy = b.groundVel * b.launch; }
    b.onGround = false;
  }
  if (!b.onGround) b.airTop = Math.max(b.airTop ?? b.y, b.y);
  if (b.y < -40) b.fellOut = true;
}

// Rayon contre les AABB (méthode des dalles) → { t, s, n:[nx,ny,nz], x, y, z } ou null
function raycast(ox, oy, oz, dx, dy, dz, maxD, filter) {
  const ex = ox + dx * maxD, ez = oz + dz * maxD;
  const list = querySolids(Math.min(ox, ex) - 0.5, Math.min(oz, ez) - 0.5, Math.max(ox, ex) + 0.5, Math.max(oz, ez) + 0.5);
  let best = maxD, hit = null, hn = null;
  const o = [ox, oy, oz], d = [dx, dy, dz];
  for (const s of list) {
    if (filter && !filter(s)) continue;
    const mn = [s.x0, s.y0, s.z0], mx = [s.x1, s.y1, s.z1];
    let t0 = -1e9, t1 = 1e9, ax = -1, sg = 0, ok = true;
    for (let k = 0; k < 3; k++) {
      if (Math.abs(d[k]) < 1e-9) { if (o[k] < mn[k] || o[k] > mx[k]) { ok = false; break; } continue; }
      let ta = (mn[k] - o[k]) / d[k], tb = (mx[k] - o[k]) / d[k], na = -1;
      if (ta > tb) { const tt = ta; ta = tb; tb = tt; na = 1; }
      if (ta > t0) { t0 = ta; ax = k; sg = na; }
      if (tb < t1) t1 = tb;
      if (t0 > t1) { ok = false; break; }
    }
    if (!ok || t0 < 0 || t0 >= best) continue;
    best = t0; hit = s; hn = [0, 0, 0]; hn[ax] = sg;
  }
  return hit ? { t: best, s: hit, n: hn, x: ox + dx * best, y: oy + dy * best, z: oz + dz * best } : null;
}
const seeThrough = (s) => s.tag !== 'glass';
function los(ax, ay, az, bx, by, bz, filter = seeThrough) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, d = Math.hypot(dx, dy, dz);
  if (d < 0.01) return true;
  return !raycast(ax, ay, az, dx / d, dy / d, dz / d, d - 0.6, filter);
}

// ------------------------------ COUVERTURE, LUMIÈRE, CACHETTE ------------------------------
function coverInfo(x, y, z) {
  let c = 1e9, sref = null;
  for (const s of querySolids(x - 0.4, z - 0.4, x + 0.4, z + 0.4)) if (s.y0 >= y + 3 && s.y0 < c) { c = s.y0; sref = s; }
  if (!sref) return { covered: false, low: false, deep: 0, h: 1e9 };
  const h = c - y, deep = Math.min(x - sref.x0, sref.x1 - x, z - sref.z0, sref.z1 - z);
  return { covered: h < 80, low: h < 30, deep, h, s: sref };
}
function isUnreachable(x, y, z) {
  if (inCatFur(x, y, z) || inCastleZone(x, y, z)) return true;
  const c = coverInfo(x, y, z);
  if (c.low && c.deep >= 8) return true;
  const n = narrowInfo(x, y, z);
  return n.narrow && n.depth >= 6;
}
// Recoin étroit (< 18 cm, trop étroit pour une main) et profondeur depuis son ouverture
const NARROW_W = 18;
const _narrow = { k: '', t: -9, v: null };
function rayLen(x, y, z, dx, dz, max) { const h = raycast(x, y, z, dx, 0, dz, max); return h ? h.t : max; }
function narrowInfo(x, y, z) {
  const key = Math.round(x) + ',' + Math.round(y) + ',' + Math.round(z);
  if (_narrow.k === key && Math.abs(G.simT - _narrow.t) < 0.3) return _narrow.v;
  const yy = y + 2.5;
  let best = { narrow: false, width: 99, depth: 0 };
  for (const [ax, az] of [[1, 0], [0, 1]]) {
    const width = (px, pz) => rayLen(px, yy, pz, ax, az, 40) + rayLen(px, yy, pz, -ax, -az, 40);
    const w0 = width(x, z);
    if (w0 >= NARROW_W) continue;
    let depth = 60;
    for (const s of [1, -1]) {
      const px = az * s, pz = ax * s;
      for (let k = 3; k <= 60; k += 3) {
        if (raycast(x, yy, z, px, 0, pz, k)) break;
        if (width(x + px * k, z + pz * k) >= NARROW_W) { depth = Math.min(depth, k); break; }
      }
    }
    if (!best.narrow || depth > best.depth) best = { narrow: true, width: w0, depth };
  }
  _narrow.k = key; _narrow.t = G.simT; _narrow.v = best;
  return best;
}
// Part des positions où un humain peut se tenir (dans la pièce) qui ont une ligne de vue sur le joueur
function exposure(x, y, z) {
  const room = roomAt(x, z), H = NAV.human;
  if (!room || !H) return 0.5;
  let n = 0, seen = 0;
  const ty = y + 2.5;
  for (let i = 1; i <= 3; i++) for (let j = 1; j <= 3; j++) {
    const vx = lerp(room.x0, room.x1, i / 4), vz = lerp(room.z0, room.z1, j / 4);
    if (!H.freeAt(vx, vz)) continue;
    n++;
    if (los(vx, 160, vz, x, ty, z) || los(vx, 110, vz, x, ty, z)) seen++;
  }
  return n ? seen / n : 0.5;
}
const inZone = (zn, x, y, z) => zn && x >= zn.x0 && x <= zn.x1 && z >= zn.z0 && z <= zn.z1 && (zn.y0 === undefined || (y >= zn.y0 && y <= zn.y1));

function daylightAt(hour) {
  if (hour < 5.5 || hour > 21.5) return 0;
  if (hour < 7.5) return (hour - 5.5) / 2;
  if (hour > 19.5) return (21.5 - hour) / 2;
  return 1;
}
function lightAt(x, y, z) {
  const room = roomAt(x, z), out = room && room.id === 'jardin';
  let L = G.daylight * (out ? 1 : 0.72);
  for (const l of W.lamps) if (l.level > 0.05) {
    const d = Math.hypot(x - l.x, y - l.y, z - l.z);
    if (d < l.radius) L = Math.max(L, l.level * (1 - d / l.radius) * 1.1);
  }
  const c = coverInfo(x, y, z);
  if (c.covered) L *= c.low ? 0.35 : 0.7;
  if (out && y < 2 && !onPath(x, z)) L *= 0.7;
  return clamp(L + 0.04, 0, 1);
}

// Blotti dans la fourrure de Moustache (sur son dos ou sous lui quand il est couché)
function inCatFur(x, y, z) {
  if (!Cat || !G.started) return false;
  if (G.mode === 'cat') return true;
  const still = (Cat.state === 'nap' || Cat.state === 'idle') && !Cat.jump;
  return still && dist2(x, z, Cat.x, Cat.z) < 15 && y > Cat.y - 4 && y < Cat.y + 26;
}
function hideScore(x, y, z) {
  if (inBaseArea(x, y, z) || inCatFur(x, y, z) || inCastleZone(x, y, z) || isInvisible()) return 100;
  if (G.base2 && dist2(x, z, G.base2.x, G.base2.z) < 16 && Math.abs(y - G.base2.y) < 10) return 95;
  if (G.flags.colony && inRect(x, z, W.zones.shedInside) && y < 30) return 100;
  const e = exposure(x, y, z), c = coverInfo(x, y, z), unreach = isUnreachable(x, y, z);
  let s = 72 - 62 * e;
  if (unreach) s += 18; else if (c.covered) s += 6;
  s += (1 - lightAt(x, y, z)) * 10;
  if (!unreach && y < 30 && trafficAt(x, z) > 0) s -= 10;
  if (!unreach && Dog && dist2(x, z, Dog.x, Dog.z) < 250) s -= 10;
  const room = roomAt(x, z);
  if (room && room.id === 'jardin' && y < 2 && !onPath(x, z)) s += 8;
  return Math.round(clamp(s, 0, 100));
}
const hideLabel = (s) => (s >= 85 ? 'Excellente' : s >= 65 ? 'Bonne' : s >= 45 ? 'Moyenne' : s >= 25 ? 'Mauvaise' : 'Exposée');
