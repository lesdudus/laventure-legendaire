// ------------------------------ NAVIGATION (grilles + A*) ------------------------------
class NavGrid {
  constructor(cell, x0, z0, x1, z1, test, inflate) {
    this.c = cell; this.x0 = x0; this.z0 = z0;
    this.w = Math.ceil((x1 - x0) / cell); this.h = Math.ceil((z1 - z0) / cell);
    this.block = new Uint8Array(this.w * this.h);
    this.test = test; this.inflate = inflate;
    for (const s of SOLIDS) if (!s.off && test(s)) this.mark(s, 1);
  }
  mark(s, v) {
    const f = this.inflate, c = this.c;
    const i0 = Math.max(0, Math.ceil((s.x0 - f - this.x0) / c - 0.5)), i1 = Math.min(this.w - 1, Math.floor((s.x1 + f - this.x0) / c - 0.5));
    const j0 = Math.max(0, Math.ceil((s.z0 - f - this.z0) / c - 0.5)), j1 = Math.min(this.h - 1, Math.floor((s.z1 + f - this.z0) / c - 0.5));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) this.block[j * this.w + i] = v;
  }
  ci(x) { return Math.floor((x - this.x0) / this.c); }
  cj(z) { return Math.floor((z - this.z0) / this.c); }
  free(i, j) { return i >= 0 && j >= 0 && i < this.w && j < this.h && !this.block[j * this.w + i]; }
  freeAt(x, z) { return this.free(this.ci(x), this.cj(z)); }
  cx(i) { return this.x0 + (i + 0.5) * this.c; }
  cz(j) { return this.z0 + (j + 0.5) * this.c; }
  nearestFree(i, j, maxR = 12) {
    if (this.free(i, j)) return [i, j];
    for (let r = 1; r <= maxR; r++) {
      let best = null, bd = 1e9;
      for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        if (this.free(i + di, j + dj)) { const d = di * di + dj * dj; if (d < bd) { bd = d; best = [i + di, j + dj]; } }
      }
      if (best) return best;
    }
    return null;
  }
  line(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / (this.c * 0.4));
    for (let k = 0; k <= n; k++) { const t = n ? k / n : 0; if (!this.freeAt(ax + (bx - ax) * t, az + (bz - az) * t)) return false; }
    return true;
  }
  path(ax, az, bx, bz, maxIter = 20000) {
    const s = this.nearestFree(this.ci(ax), this.cj(az)), g = this.nearestFree(this.ci(bx), this.cj(bz));
    if (!s || !g) return null;
    const W2 = this.w, N = this.w * this.h, si = s[1] * W2 + s[0], gi = g[1] * W2 + g[0];
    if (si === gi) return [{ x: bx, z: bz }];
    if (!this.gs) { this.gs = new Float32Array(N); this.fs = new Float32Array(N); this.from = new Int32Array(N); this.seen = new Uint32Array(N); this.closed = new Uint32Array(N); this.heap = new Int32Array(N * 4); this.gen = 0; }
    const gen = ++this.gen, gs = this.gs, fs = this.fs, from = this.from, seen = this.seen, closed = this.closed, heap = this.heap;
    let hn = 0;
    const push = (i) => { let k = hn++; heap[k] = i; while (k > 0) { const p = (k - 1) >> 1; if (fs[heap[p]] <= fs[heap[k]]) break; const t = heap[p]; heap[p] = heap[k]; heap[k] = t; k = p; } };
    const pop = () => { const top = heap[0]; heap[0] = heap[--hn]; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < hn && fs[heap[l]] < fs[heap[m]]) m = l; if (r < hn && fs[heap[r]] < fs[heap[m]]) m = r; if (m === k) break; const t = heap[m]; heap[m] = heap[k]; heap[k] = t; k = m; } return top; };
    const hcost = (i) => { const dx = Math.abs((i % W2) - g[0]), dz = Math.abs(((i / W2) | 0) - g[1]); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
    seen[si] = gen; gs[si] = 0; from[si] = -1; fs[si] = hcost(si); push(si);
    let it = 0, found = false;
    while (hn > 0 && it++ < maxIter) {
      const cur = pop(); if (closed[cur] === gen) continue; closed[cur] = gen;
      if (cur === gi) { found = true; break; }
      const ci = cur % W2, cj = (cur / W2) | 0;
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        if (!di && !dj) continue;
        const ni = ci + di, nj = cj + dj;
        if (!this.free(ni, nj)) continue;
        if (di && dj && (!this.free(ci + di, cj) || !this.free(ci, cj + dj))) continue;
        const n = nj * W2 + ni;
        if (closed[n] === gen) continue;
        const ng = gs[cur] + (di && dj ? 1.414 : 1);
        if (seen[n] !== gen || ng < gs[n]) { seen[n] = gen; gs[n] = ng; from[n] = cur; fs[n] = ng + hcost(n); if (hn < heap.length) push(n); }
      }
    }
    if (!found) return null;
    const cells = []; for (let c = gi; c !== -1; c = from[c]) cells.push(c); cells.reverse();
    const pts = cells.map((c) => ({ x: this.cx(c % W2), z: this.cz((c / W2) | 0) }));
    if (this.freeAt(bx, bz)) pts[pts.length - 1] = { x: bx, z: bz };
    const out = []; let a = { x: ax, z: az }, k = 0;
    while (k < pts.length - 1) {
      let far = k + 1;
      for (let m = pts.length - 1; m > k + 1; m--) if (this.line(a.x, a.z, pts[m].x, pts[m].z)) { far = m; break; }
      out.push(pts[far]); a = pts[far]; k = far;
    }
    if (!out.length) out.push(pts[pts.length - 1]);
    return out;
  }
}
const NAV = { human: null, dog: null, cat: null, traffic: null };
function buildNav() {
  NAV.human = new NavGrid(20, -120, -20, 1320, 1680, (s) => s.y1 > 25 && s.y0 < 170 && s.tag !== 'door' && s.tag !== 'flap', 14);
  NAV.dog = new NavGrid(10, -120, -20, 1320, 1680, (s) => s.y1 > 4 && s.y0 < 45 && s.tag !== 'dogbed' && s.tag !== 'bowl', 9);
  NAV.cat = new NavGrid(10, -120, -20, 1320, 1680, (s) => s.y1 > 6 && s.y0 < 22 && !['catbed', 'flap', 'bowl', 'dogbed'].includes(s.tag), 6);
  markCastleNav([NAV.human, NAV.dog, NAV.cat]);
  // carte de fréquentation des humains (pour le score de cachette)
  const H = NAV.human; NAV.traffic = new Uint8Array(H.w * H.h);
  const keys = ['marc_desk', 'marc_tv', 'marc_breakfast', 'marc_cook', 'marc_fridge', 'marc_sdb', 'marc_bed', 'lea_bed', 'lea_breakfast', 'lea_rug1', 'front_door', 'lea_bath', 'marc_garden1'];
  for (let a = 0; a < keys.length; a++) for (let b = a + 1; b < keys.length; b++) {
    const A = W.spots[keys[a]], B = W.spots[keys[b]];
    const p = H.path(A.ax, A.az, B.ax, B.az);
    if (!p) continue;
    let prev = { x: A.ax, z: A.az };
    for (const q of p) {
      const d = Math.hypot(q.x - prev.x, q.z - prev.z), n = Math.ceil(d / 10);
      for (let k = 0; k <= n; k++) {
        const x = lerp(prev.x, q.x, k / n), z = lerp(prev.z, q.z, k / n);
        const i = H.ci(x), j = H.cj(z);
        if (i >= 0 && j >= 0 && i < H.w && j < H.h) NAV.traffic[j * H.w + i] = 1;
      }
      prev = q;
    }
  }
}
function trafficAt(x, z) { const H = NAV.human; if (!H) return 0; const i = H.ci(x), j = H.cj(z); return i >= 0 && j >= 0 && i < H.w && j < H.h ? NAV.traffic[j * H.w + i] : 0; }

// ------------------------------ BRUIT & ODEUR ------------------------------
function emitNoise(x, y, z, radius, intensity, src) {
  for (const h of HUMANS) h.hear(x, y, z, radius, intensity, src);
  if (Dog && src !== 'aboiement') Dog.hear(x, y, z, radius, intensity, src);
  if (src === 'joueur' || src === 'voiture' || src === 'hoquet') G.noiseLevel = Math.max(G.noiseLevel, intensity);
}
const Scent = {
  pts: [],
  drop(x, z, t) { const l = this.pts[this.pts.length - 1]; if (l && Math.hypot(l.x - x, l.z - z) < 6) { l.t = t; return; } this.pts.push({ x, z, t }); if (this.pts.length > 500) this.pts.shift(); },
  prune(t) { while (this.pts.length && t - this.pts[0].t > CONFIG.dog.scentLife) this.pts.shift(); },
  wash() { this.pts.length = 0; },
};

// Suiveur de chemin générique (recalcul si la cible bouge, sur minuterie optionnelle, ou après un échec)
function followPath(e, grid, tx, tz, speed, dt, repath = 0) {
  e.repathT = (e.repathT ?? 0) - dt;
  const moved = !e.pathTarget || Math.hypot(e.pathTarget.x - tx, e.pathTarget.z - tz) > 35;
  const wantNew = !e.path ? !(e.pathFail && e.repathT > 0 && !moved) : moved || (repath > 0 && e.repathT <= 0);
  if (wantNew) {
    e.path = grid.path(e.x, e.z, tx, tz); e.pi = 0; e.pathTarget = { x: tx, z: tz };
    e.pathFail = !e.path; e.repathT = e.path ? repath : 1.5;
  }
  if (!e.path || e.pi >= e.path.length) return 'done';
  const p = e.path[e.pi], dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz);
  const st = speed * dt;
  if (d <= st) { e.x = p.x; e.z = p.z; e.pi++; if (e.pi >= e.path.length) return 'done'; }
  else { e.x += (dx / d) * st; e.z += (dz / d) * st; e.ry = turnTo(e.ry, Math.atan2(dx, dz), dt * 8); }
  return 'moving';
}
function turnTo(a, b, k) { return a + angWrap(b - a) * Math.min(1, k); }
