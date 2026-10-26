// ------------------------------ VOITURE DE POCHE · TENUE D'INVISIBILITÉ · REPÈRES D'ÉQUIPEMENT ------------------------------
const isInvisible = () => !!(G && G.invis && G.invis.on);
const carStowed = () => !!(G && G.flags && G.flags.carStowed);

// ---------- voiture rangeable ----------
function stowCar() {
  if (G.mode !== 'walk' || carStowed()) return;
  if (G.race) return toast('Pas pendant le Grand Prix !', 'warn');
  if (INV.add('voiture', 1)) return toast('Inventaire plein : fais de la place pour ranger la voiture.', 'warn');
  G.flags.carStowed = true; CAR_MODEL.visible = false; SFX.play('pickup');
  toast('🚗 Voiture rangée dans ton inventaire. Clic droit sur 🚗 pour la ressortir.', 'success');
  UI.dirty = true; if (UI.panel === 'inv') UI.renderInv();
}
function deployCar(i) {
  if (G.mode !== 'walk') return toast('Pose-toi d’abord au sol pour sortir la voiture.', 'warn');
  if (UI.panel && UI.panel !== 'inv') return;
  const P = G.p, f = camForward(), l = Math.hypot(f.x, f.z) || 1, fx = f.x / l, fz = f.z / l, R = CONFIG.car.radius;
  for (const d of [11, 14, 8, 18]) {
    const x = P.x + fx * d, z = P.z + fz * d, y = groundAt(x, z, R * 0.7, P.y + 3);
    if (Math.abs(y - P.y) > 4 || !spotFree(x, y + 0.2, z, R, 5.2) || !los(P.x, P.y + 2, P.z, x, y + 2, z)) continue;
    INV.takeAt(i, 1); G.flags.carStowed = false;
    Object.assign(G.car, { x, y: y + 0.4, z, vx: 0, vy: 0, vz: 0, heading: Math.atan2(fx, fz), onGround: false });
    CAR_MODEL.visible = true; CAR_MODEL.position.set(x, y + 0.4, z); CAR_MODEL.rotation.set(0, G.car.heading, 0, 'YXZ');
    SFX.play('place'); toast('🚗 La voiture est posée devant toi. F pour monter !', 'success');
    UI.dirty = true; if (UI.panel === 'inv') UI.renderInv();
    return;
  }
  toast('Pas assez de place ici pour sortir la voiture : recule ou tourne-toi vers un espace libre.', 'warn');
}
// cohérence au chargement : voiture rangée sans objet → on la gare devant la base ; objet sans voiture rangée → retiré
function fixCarState() {
  const owned = INV.count('voiture') + CHEST.count('voiture');
  if (carStowed() && !owned) { G.flags.carStowed = false; Object.assign(G.car, { x: 950, y: 0.4, z: 16, heading: -Math.PI / 2 }); }
  if (!carStowed() && owned) { INV.remove('voiture', INV.count('voiture')); CHEST.remove('voiture', CHEST.count('voiture')); }
  CAR_MODEL.visible = !carStowed();
}

// ---------- tenue d'invisibilité ----------
const CRYSTAL_SPOTS = [[182, 286], [482, 642], [962, 562], [1082, 252]]; // chambre, salon, cuisine, bureau
let GHOST_MAT = null;
function crystalsOwned() { return INV.count('cristal') + CHEST.count('cristal') + PICKUPS.filter((p) => p.id === 'cristal').length; }
function spawnCrystal() {
  if (crystalsOwned() >= 4) return false;
  const free = CRYSTAL_SPOTS.filter(([x, z]) => !PICKUPS.some((p) => p.id === 'cristal' && dist2(p.x, p.z, x, z) < 10));
  if (!free.length) return false;
  const [x, z] = pick(free);
  spawnPickup('cristal', 1, x, groundAt(x, z, 0.5, 10), z);
  return true;
}
function useCrystal() {
  if (!INV.count('cristal')) return false;
  INV.remove('cristal', 1); G.invis.charge = CONFIG.invisMinutes;
  toast('🔮 Cristal d’ombre inséré : 4 h d’invisibilité.', 'info'); refreshEquip();
  return true;
}
function toggleInvis() {
  const I = G.invis;
  if (I.on) { I.on = false; SFX.play('click'); toast('🫥 Tenue d’invisibilité coupée (la charge restante est conservée).', 'info'); refreshEquip(); return; }
  if (G.rest) return toast('Pas pendant le repos.', 'info');
  if (I.charge <= 0 && !useCrystal()) return toast('Il te faut un Cristal d’ombre 🔮 pour alimenter la tenue. Un nouveau apparaît chaque matin dans la maison.', 'warn');
  I.on = true; Scent.wash(); SFX.play('whoosh');
  toast('🫥 Tu es invisible ! Les humains et Rex ne te voient plus… mais ils t’entendent toujours.', 'success');
  refreshEquip();
}
function invisTick(sd) {
  const I = G.invis; if (!I || !I.on) return;
  if (G.rest) { I.on = false; toast('🫥 La tenue s’éteint pendant le repos.', 'info'); refreshEquip(); return; }
  if (!INV.count('tenue_invis')) { I.on = false; refreshEquip(); return; }
  I.charge -= (sd * CONFIG.timeScale) / 60;
  if (I.charge <= 0) {
    I.charge = 0;
    if (!useCrystal()) { I.on = false; SFX.play('hurt', 0.4); toast('🔮 Plus d’énergie : tu redeviens visible !', 'danger'); refreshEquip(); }
  }
}
function updateInvisFx() {
  const on = isInvisible(), m = PLAYER_MODEL;
  if (on && !GHOST_MAT) GHOST_MAT = new THREE.MeshBasicMaterial({ color: 0xb39ddb, transparent: true, opacity: 0.25, depthWrite: false });
  if (m) m.traverse((o) => {
    if (!o.isMesh) return;
    if (on && o.material !== GHOST_MAT) { o.userData.preGhost = o.material; o.material = GHOST_MAT; }
    else if (!on && o.material === GHOST_MAT) o.material = o.userData.preGhost;
  });
  if (on) GHOST_MAT.opacity = 0.18 + 0.1 * Math.sin(G.simT * 6);
  $('v-invis').classList.toggle('on', on);
}

// ---------- repères d'équipement (cases + barre de stats) ----------
function refreshEquip() {
  UI.dirty = true;
  if (UI.panel === 'inv') UI.renderInv();
  else if (UI.panel === 'chest') UI.renderChest();
}
function equipHUD() {
  const parts = [];
  if (G.armor && G.armor.on) parts.push(`<span class="eq armor" title="Armure portée">🛡️ ${'●'.repeat(G.armor.dur)}${'○'.repeat(Math.max(0, 5 - G.armor.dur))}</span>`);
  if (isInvisible()) parts.push(`<span class="eq invis" title="Invisible">🫥 ${fmtDur(G.invis.charge)}</span>`);
  if ((G.fx.feastUntil || 0) > G.time) parts.push(`<span class="eq feast" title="Festin du barbecue">🍖 ${fmtDur(G.fx.feastUntil - G.time)}</span>`);
  if (huntActive()) parts.push(`<span class="eq hunt" title="Marc et Léa te cherchent (traces de crème)">👣 ${fmtDur(G.fx.huntUntil - G.time)}</span>`);
  else if (CREAM.feet > 0) parts.push(`<span class="eq feast" title="Tes pieds laissent des traces de crème">🍰 ${CREAM.feet} pas</span>`);
  return parts.join('');
}
const fmtDur = (min) => { const m = Math.max(0, Math.ceil(min)), h = Math.floor(m / 60); return h ? `${h} h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };
