// ------------------------------ STYLES GRAPHIQUES : « Minecraft (pixel) » / « Low-poly chaleureux » ------------------------------
// Le style low-poly remplace à la volée les matériaux opaques par des équivalents sans texture pixel,
// à faces planes et plus saturés. Les matériaux d'origine restent intacts : la bascule est réversible.
const STYLES = { pixel: 'Minecraft (pixel)', lowpoly: 'Low-poly chaleureux' };
const STYLE = { id: 'pixel', lp: new WeakMap(), isLp: new WeakSet(), gradeKey: '', dirty: false };

const styleEligible = (m) => !!m && (m.isMeshLambertMaterial || m.isMeshStandardMaterial || m.isMeshPhongMaterial) && !m.transparent && !m.userData.noStyle;
function lowPolyMat(m) {
  let n = STYLE.lp.get(m);
  if (n) return n;
  const keepMap = m.map && !m.map.userData.pixel;  // TNT, blocs-lettres… restent reconnaissables
  n = new THREE.MeshLambertMaterial({ color: m.color, emissive: m.emissive, vertexColors: m.vertexColors, map: keepMap ? m.map : null, side: m.side, flatShading: true });
  n.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n  diffuseColor.rgb = max(mix(vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114))), diffuseColor.rgb, 1.32), 0.0);');
  };
  n.customProgramCacheKey = () => 'lowpoly';
  n.userData.src = m;
  STYLE.lp.set(m, n); STYLE.isLp.add(n);
  return n;
}
// Parcourt la scène : applique (ou retire) le style, y compris aux objets créés pendant la partie
function styleSweep(lp) {
  SCENE.traverse((o) => {
    if (!o.isMesh) return;
    const cur = o.material;
    if (Array.isArray(cur)) {
      if (lp) {
        if (o.userData.lpArr === cur) { for (const m of cur) if (STYLE.isLp.has(m)) syncLp(m); return; }
        if (!cur.some(styleEligible)) return;
        o.userData.srcArr = cur; o.material = o.userData.lpArr = cur.map((m) => (styleEligible(m) ? lowPolyMat(m) : m));
      } else if (o.userData.lpArr === cur) { o.material = o.userData.srcArr; o.userData.lpArr = o.userData.srcArr = null; }
      return;
    }
    if (lp) {
      if (STYLE.isLp.has(cur)) syncLp(cur);
      else if (styleEligible(cur)) o.material = lowPolyMat(cur);
    } else if (STYLE.isLp.has(cur)) o.material = cur.userData.src;
  });
}
// Les couleurs modifiées en jeu sur le matériau d'origine sont recopiées
function syncLp(n) { const s = n.userData.src; n.color.copy(s.color); n.emissive.copy(s.emissive); n.visible = s.visible; }

// Ambiance horaire : [heure, soleil, ciel (hémisphère), sol (hémisphère), fond/brouillard, calque haut, calque bas]
const LP_KEYS = [
  [0, 0x8fa4ff, 0x7d8fd8, 0x3a3050, 0x1c2452, [90, 110, 210, 0.10], [40, 25, 100, 0.20]],
  [5.5, 0xb59cff, 0x9a8fd8, 0x4a3a5a, 0x4a4385, [170, 120, 200, 0.10], [60, 35, 110, 0.18]],
  [7, 0xffb070, 0xffd6a0, 0x8a5a44, 0xffbf8f, [255, 150, 70, 0.16], [110, 50, 140, 0.12]],
  [10, 0xffe2b0, 0xfff0d8, 0x9a7a5a, 0xcfe4f2, [255, 170, 90, 0.08], [120, 70, 160, 0.07]],
  [15, 0xfff0d0, 0xfff6e8, 0x9a7a5a, 0xc6e2f5, [255, 170, 90, 0.06], [120, 70, 160, 0.06]],
  [18.5, 0xff9a50, 0xffc08a, 0x7a4a5a, 0xff9f6b, [255, 120, 50, 0.18], [120, 50, 150, 0.16]],
  [20.5, 0xd08aff, 0xa98bd8, 0x4a3560, 0x5a3f8a, [210, 110, 170, 0.12], [60, 30, 120, 0.20]],
  [22.5, 0x8fa4ff, 0x7d8fd8, 0x3a3050, 0x1c2452, [90, 110, 210, 0.10], [40, 25, 100, 0.20]],
  [24, 0x8fa4ff, 0x7d8fd8, 0x3a3050, 0x1c2452, [90, 110, 210, 0.10], [40, 25, 100, 0.20]],
];
const _lpA = new THREE.Color(), _lpB = new THREE.Color();
function lpMix(i, a, b, k) { return _lpA.setHex(a[i]).lerp(_lpB.setHex(b[i]), k); }
function lpRgba(a, b, k) { const c = a.map((v, i) => v + (b[i] - v) * k); return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${c[3].toFixed(3)})`; }
// Valeurs absolues (pas de cumul image après image, même en pause)
function styleLighting() {
  const h = ((G.hour % 24) + 24) % 24, d = G.daylight;
  let i = 0; while (i < LP_KEYS.length - 2 && h >= LP_KEYS[i + 1][0]) i++;
  const a = LP_KEYS[i], b = LP_KEYS[i + 1], k = clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
  SUN.color.copy(lpMix(1, a, b, k)); HEMI.color.copy(lpMix(2, a, b, k)); HEMI.groundColor.copy(lpMix(3, a, b, k));
  SCENE.background.copy(lpMix(4, a, b, k)); SCENE.fog.color.copy(SCENE.background);
  SCENE.fog.near = 700; SCENE.fog.far = 3200;
  HEMI.intensity = 0.65 + 1.75 * d; SUN.intensity = 0.15 + 1.9 * d;
  NIGHT.color.setHex(0x7f8fd0); NIGHT.intensity = (1 - d) * 1.35;
  const key = lpRgba(a[5], b[5], k) + lpRgba(a[6], b[6], k);
  if (key !== STYLE.gradeKey) { STYLE.gradeKey = key; $('grade').style.background = `linear-gradient(180deg, ${lpRgba(a[5], b[5], k)}, ${lpRgba(a[6], b[6], k)})`; }
}
function applyStyle(id) {
  STYLE.id = STYLES[id] ? id : 'pixel';
  const lp = STYLE.id === 'lowpoly';
  styleSweep(lp);
  $('grade').classList.toggle('hidden', !lp);
  if (lp) styleLighting();
  else {
    HEMI.color.setHex(0xffffff); HEMI.groundColor.setHex(0x8a7a66); NIGHT.color.setHex(0x5a6aa0);
    SCENE.fog.near = 2200; SCENE.fog.far = 6000; STYLE.gradeKey = '';
    updateLighting(0);
  }
}
// Appelé à chaque image, juste avant le rendu. Le parcours complet de la scène ne se fait que si des
// objets ont été ajoutés (crochet sur Object3D.add) ou toutes les 30 images (matériaux réassignés).
const _o3dAdd = THREE.Object3D.prototype.add;
THREE.Object3D.prototype.add = function (...a) { STYLE.dirty = true; return _o3dAdd.apply(this, a); };
let _styleTick = 0;
function styleFrame() {
  if (STYLE.id !== 'lowpoly') return;
  if (STYLE.dirty || ++_styleTick >= 30) { STYLE.dirty = false; _styleTick = 0; styleSweep(true); }
  styleLighting();
}
