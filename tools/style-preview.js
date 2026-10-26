// Prévisualisation de styles graphiques (runtime, sans modifier le jeu)
import * as THREE from 'three';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js';

const M = window.__minuscule, R = M.renderer, S = M.scene, cam = window.__cam;
const meshes = [], lights = [];
S.traverse((o) => { if (o.isMesh) meshes.push(o); if (o.isLight) lights.push(o); });
for (const o of meshes) o.userData.__m0 = o.material;
for (const l of lights) l.userData.__l0 = { i: l.intensity, c: l.color.getHex(), g: l.groundColor ? l.groundColor.getHex() : null };
const bg0 = S.background.clone(), fog0 = { c: S.fog.color.clone(), n: S.fog.near, f: S.fog.far };
const pr0 = R.getPixelRatio();
const pmrem = new THREE.PMREMGenerator(R);
const ENV = pmrem.fromScene(new RoomEnvironment(R), 0.04).texture;

function canvasTex(size, fn, seed = 1, linear = true) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const img = g.createImageData(size, size); let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const v = Math.max(0, Math.min(1, fn(x, y, rnd))) * 255, i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  if (linear) { t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; } else t.magFilter = THREE.NearestFilter;
  t.anisotropy = 8; return t;
}
// bruit de valeur lissé, périodique
function vnoise(size, cell, seed) {
  const n = size / cell, grid = []; let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n * n; i++) grid.push(rnd());
  const at = (i, j) => grid[((j % n + n) % n) * n + ((i % n + n) % n)];
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => { const fx = x / cell, fy = y / cell, i = Math.floor(fx), j = Math.floor(fy), u = sm(fx - i), v = sm(fy - j);
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v; };
}
const n1 = vnoise(128, 32, 3), n2 = vnoise(128, 8, 7), n3 = vnoise(128, 16, 11);
const TX = {
  clay: canvasTex(128, (x, y) => 0.88 + 0.08 * n1(x, y) + 0.04 * n2(x, y)),
  water: canvasTex(128, (x, y, r) => 0.8 + 0.12 * n1(x, y) + 0.06 * n3(x, y) + r() * 0.03),
  kraft: canvasTex(128, (x, y, r) => 0.86 + 0.07 * n2(x, y * 4) + 0.03 * n1(x, y) + (r() < 0.03 ? -0.1 : 0) + r() * 0.03),
  grain: canvasTex(128, (x, y, r) => 0.9 + 0.06 * n3(x, y) + r() * 0.05),
};
function gradient(steps) {
  const d = new Uint8Array(steps.length * 4); steps.forEach((v, i) => { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; });
  const t = new THREE.DataTexture(d, steps.length, 1, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}
const G3 = gradient([90, 175, 255]), G2 = gradient([200, 255]);

const special = (m) => m.transparent || m.isMeshBasicMaterial || m.isSpriteMaterial || m.isPointsMaterial || m.isLineBasicMaterial;
function base(m) { return { color: m.color ? m.color.clone() : new THREE.Color(0xffffff), vertexColors: !!m.vertexColors, side: m.side }; }
function pastelize(mat, k) {
  mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <color_vertex>', `#include <color_vertex>\n#ifdef USE_COLOR\n vColor.rgb = mix(vColor.rgb, vec3(1.0,0.96,0.97), ${k.toFixed(2)});\n#endif`); };
  mat.customProgramCacheKey = () => 'pastel' + k; return mat;
}
function outlineMat(t, color) {
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec4 _mv = modelViewMatrix * vec4(position, 1.0);\n vec3 transformed = position + normal * ${t.toFixed(4)} * max(-_mv.z, 1.0);`); };
  m.customProgramCacheKey = () => 'ol' + t + color; return m;
}

const STYLES = {
  actuel: { make: null },
  toon: { make: (m) => new THREE.MeshToonMaterial({ ...base(m), gradientMap: G3 }), outline: [0.0028, 0x1a1414] },
  ligne_claire: { make: (m) => new THREE.MeshBasicMaterial({ ...base(m) }), outline: [0.0045, 0x111111], post: 'saturate(1.15) contrast(1.05)' },
  pate_a_modeler: { make: (m) => new THREE.MeshStandardMaterial({ ...base(m), roughness: 0.92, metalness: 0, bumpMap: TX.clay, bumpScale: 1.2, map: TX.clay }), env: 0.6, tone: 1.5, post: 'saturate(1.25) contrast(1.05)', light: { hemi: 2.4, sun: 2.2 } },
  film_anime: { make: (m) => new THREE.MeshStandardMaterial({ ...base(m), roughness: 0.55, metalness: 0, map: TX.grain }), env: 0.8, tone: 1.45, shadows: true, post: 'saturate(1.15) contrast(1.04)', light: { hemi: 1.9, sun: 1.2 } },
  low_poly: { make: (m) => new THREE.MeshLambertMaterial({ ...base(m), flatShading: true }), fog: [0xffc58a, 250, 900], post: 'saturate(1.35) contrast(1.08)', grade: ['rgba(255,140,60,0.10)', 'rgba(80,40,140,0.12)'], light: { hemi: 1.6, sun: 2.2, sunColor: 0xffb070 } },
  aquarelle: { make: (m) => { const x = new THREE.MeshLambertMaterial({ ...base(m), map: TX.water }); x.emissive = new THREE.Color(0x2a2622); return x; }, post: 'saturate(0.8) contrast(0.88) brightness(1.08) blur(0.4px)', paper: true, vignette: 0.35 },
  pastel: { make: (m) => pastelize(new THREE.MeshToonMaterial({ ...base(m), gradientMap: G2 }), 0.3), post: 'saturate(1.15) brightness(1.04)', light: { hemi: 2.6, sun: 1.2 } },
  plastique: { make: (m) => new THREE.MeshPhysicalMaterial({ ...base(m), roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }), env: 1.2, tone: 1.5, post: 'saturate(1.3) contrast(1.06)', light: { hemi: 1.8, sun: 1.8 } },
  papier: { make: (m) => new THREE.MeshLambertMaterial({ ...base(m), map: TX.kraft }), outline: [0.0016, 0x5b4632], post: 'sepia(0.18) saturate(0.85) contrast(1.02)' },
  retro_ps1: { make: (m) => { const x = new THREE.MeshLambertMaterial({ ...base(m) }); if (m.map) { const t = m.map.clone(); t.magFilter = THREE.LinearFilter; t.needsUpdate = true; x.map = t; } return x; }, lowres: 0.2, fog: [0x6f7f95, 120, 700], dither: true },
};

const cache = new Map(); let outlines = [];
function restore() {
  for (const o of outlines) o.parent && o.parent.remove(o); outlines = [];
  for (const o of meshes) o.material = o.userData.__m0;
  for (const l of lights) { const d = l.userData.__l0; l.intensity = d.i; l.color.setHex(d.c); if (d.g !== null) l.groundColor.setHex(d.g); l.castShadow = false; }
  S.background = bg0.clone(); S.fog.color.copy(fog0.c); S.fog.near = fog0.n; S.fog.far = fog0.f; S.environment = null;
  R.toneMapping = THREE.NoToneMapping; R.shadowMap.enabled = false; R.setPixelRatio(pr0);
  for (const o of meshes) { o.castShadow = o.receiveShadow = false; }
  if (window.__sun2) { S.remove(window.__sun2, window.__sun2.target); window.__sun2 = null; }
}
function apply(name) {
  restore(); const st = STYLES[name]; if (!st.make) return;
  for (const o of meshes) {
    const m0 = o.userData.__m0; if (!m0 || Array.isArray(m0) || special(m0)) continue;
    const key = name + m0.uuid; if (!cache.has(key)) { const nm = st.make(m0); if (m0.map && !nm.map && name === 'retro_ps1') nm.map = m0.map; cache.set(key, nm); }
    o.material = cache.get(key);
    if (st.outline && o.geometry && o.geometry.attributes.normal && o.visible) {
      const ol = new THREE.Mesh(o.geometry, outlineMat(st.outline[0], st.outline[1])); ol.userData.__ol = true; ol.renderOrder = -1; o.add(ol); outlines.push(ol);
    }
  }
  if (st.env) { S.environment = ENV; for (const m of cache.values()) if ('envMapIntensity' in m) m.envMapIntensity = st.env; }
  if (st.tone) { R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = st.tone; }
  if (st.light) for (const l of lights) {
    if (l.isHemisphereLight) l.intensity = st.light.hemi;
    if (l.isDirectionalLight && l.userData.__l0.i > 0.5) { l.intensity = st.light.sun; if (st.light.sunColor) l.color.setHex(st.light.sunColor); }
  }
  if (st.fog) { S.fog.color.setHex(st.fog[0]); S.fog.near = st.fog[1]; S.fog.far = st.fog[2]; S.background = new THREE.Color(st.fog[0]); }
  if (st.shadows) {
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    const L = new THREE.DirectionalLight(0xfff0dc, 2.4); L.position.set(420, 235, 830); L.target.position.set(300, 0, 680);
    L.castShadow = true; L.shadow.mapSize.set(2048, 2048); Object.assign(L.shadow.camera, { left: -280, right: 280, top: 280, bottom: -280, near: 1, far: 700 }); L.shadow.bias = -0.0006; L.shadow.normalBias = 0.4;
    S.add(L, L.target); window.__sun2 = L;
    for (const o of meshes) { o.castShadow = true; o.receiveShadow = true; }
    for (const m of cache.values()) m.needsUpdate = true;
  }
}
function paperOverlay(g, w, h) {
  const p = document.createElement('canvas'); p.width = w; p.height = h; const q = p.getContext('2d'); const img = q.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const v = 225 + Math.random() * 30; img.data[i * 4] = v; img.data[i * 4 + 1] = v - 4; img.data[i * 4 + 2] = v - 12; img.data[i * 4 + 3] = 255; }
  q.putImageData(img, 0, 0); g.globalCompositeOperation = 'multiply'; g.drawImage(p, 0, 0); g.globalCompositeOperation = 'source-over';
}
async function shot(name, file) {
  apply(name); const st = STYLES[name];
  if (st.lowres) R.setPixelRatio(st.lowres);
  R.__orig(S, cam); if (st.shadows) R.__orig(S, cam);
  const src = R.domElement, w = 1600, h = Math.round(1600 * src.height / src.width);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.imageSmoothingEnabled = !st.lowres; if (st.post) g.filter = st.post;
  g.drawImage(src, 0, 0, w, h); g.filter = 'none';
  if (st.grade) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, st.grade[0]); gr.addColorStop(1, st.grade[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  if (st.paper) paperOverlay(g, w, h);
  if (st.vignette) { const rg = g.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.95); rg.addColorStop(0, 'rgba(120,90,60,0)'); rg.addColorStop(1, `rgba(120,90,60,${st.vignette})`); g.fillStyle = rg; g.fillRect(0, 0, w, h); }
  if (st.dither) {
    const id = g.getImageData(0, 0, w, h), d = id.data, B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, t = (B[((y >> 2) & 3) * 4 + ((x >> 2) & 3)] / 16 - 0.5) * 18; for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, Math.round((d[i + k] + t) / 32) * 32)); }
    g.putImageData(id, 0, 0);
  }
  const data = c.toDataURL('image/jpeg', 0.88);
  return data;
}
window.__STY = { apply, restore, shot, STYLES };
