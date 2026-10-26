// ------------------------------ MISSIONS ------------------------------
const pos = (x, y, z) => ({ x, y, z });
const MAIN = [
  { id: 'reveil', title: 'Réveil', desc: "Mange quelque chose, puis bois quelque chose. Ouvre ton inventaire (I) ou sélectionne un objet (1-5) et fais clic droit.", check: () => G.flags.ate && G.flags.drank, target: () => null },
  { id: 'volant', title: 'Au volant', desc: "Monte dans ta voiture (F) et rejoins le tapis du salon. Attention : la voiture est bruyante et Marc travaille juste devant ta base ! Roule doucement près de lui, ou passe par le trou dans la plinthe (mur ouest du bureau) vers la salle de bain.", check: () => G.mode === 'car' && inRect(G.p.x, G.p.z, W.zones.salonRug), target: () => pos(285, 1, 630) },
  { id: 'chat', title: 'Un ami à moustaches', desc: "Gagne 20 points d'affection avec Moustache le chat : caresse-le (E) ou offre-lui à manger (objet en main + E). Tu pourras ensuite monter sur son dos (F) !", check: () => G.cat.aff >= 20, target: () => (Cat ? pos(Cat.x, Cat.y + 20, Cat.z) : null) },
  { id: 'poisson', title: 'Les bulles du sage', desc: "Parle à Bubulle, le poisson de l'aquarium du salon (E devant l'aquarium, côté ouest du salon).", check: () => G.flags.fishPlan, target: () => pos(66, 0, 735) },
  { id: 'pieces', title: 'Pièces détachées', desc: "Rassemble une feuille de papier (sur le bureau, grimpe par la règle), un élastique (sur la table de la cuisine), un trombone (bureau, près de l'imprimante) et une pile (sous le meuble TV du salon).", check: () => ['feuille', 'elastique', 'trombone', 'pile'].every((k) => ownCount(k) > 0) || INV.count('avion') > 0 || G.flags.launched, target: () => missingPartTarget(), progress: () => ['feuille', 'elastique', 'trombone', 'pile'].map((k) => (ownCount(k) > 0 ? '✔ ' : '✖ ') + ITEMS[k].name).join(' · ') },
  { id: 'atelier', title: "L'atelier", desc: "Retourne à ta base (le trou de souris derrière le bureau) et fabrique l'avion en papier motorisé à l'établi (E sur la boîte d'allumettes).", check: () => INV.count('avion') > 0 || G.flags.launched, target: () => pos(914, 6, -56) },
  { id: 'envol', title: 'Le Grand Départ', desc: "Grimpe sur le rebord de la fenêtre du salon (pouf → canapé → accoudoir → dossier). Elle est ouverte de 9h à 19h. Lance l'avion (E) et vise la lucarne sur le toit de la cabane du jardin. Raté ? Relance depuis la table du jardin.", check: () => G.flags.colony, target: () => (G.flags.launched ? pos(1075, 206, 1490) : pos(300, 90, 848)) },
];
function missingPartTarget() {
  for (const k of ['feuille', 'elastique', 'trombone', 'pile']) {
    if (ownCount(k) > 0) continue;
    const s = SPAWNS.find((q) => q.id === k && q.once && !q.done) || SPAWNS.find((q) => q.id === k);
    if (s) return pos(s.x, s.y, s.z);
  }
  return null;
}
const SIDE = [
  { id: 'tresor', title: 'Le trésor de Bubulle', desc: 'Une bague brille au fond de l’aquarium. Apporte un flocon de céréale géant à Bubulle.', check: () => G.flags.ringGiven, reward: { bonbon: 1 }, target: () => pos(66, 0, 735) },
  { id: 'bague', title: 'Bague retrouvée', desc: 'Dépose la bague dorée sur la table de nuit de la chambre (celle avec la bougie). Grimpe par la pile de livres.', req: 'tresor', check: () => G.flags.ringReturned, reward: { bonbon: 2 }, target: () => pos(115, 55, 48), msg: 'Marc est de bonne humeur : les humains sont moins vigilants jusqu’à demain.' },
  { id: 'chips', title: 'Opération Chips', desc: 'Vole l’éclat de chips de la cuisine pendant que Rex dort.', check: () => G.flags.chipsHeist, reward: { soda: 1 }, target: () => pos(1060, 0, 500) },
  { id: 'gp', title: 'Grand Prix du Salon', desc: 'En voiture, approche le drapeau à damier (salon) et appuie sur E : passe les 6 portiques en moins de 40 s.', check: () => G.flags.raceWon, reward: {}, upgrade: 'turbo', target: () => pos(440, 0, 560) },
  { id: 'amis', title: 'Meilleurs amis', desc: 'Dès 20 d’affection, monte sur Moustache (F près de lui). Ensemble, grimpez tout en haut de l’armoire de la chambre, bond après bond : par terre → pile de cartons → armoire.', check: () => G.flags.catArmoire, reward: { croquette: 3 }, target: () => (G.cat.aff < CONFIG.cat.rideAff && Cat ? pos(Cat.x, Cat.y + 20, Cat.z) : pos(380, 215, 330)), progress: () => (G.cat.aff < CONFIG.cat.rideAff ? `Affection ${Math.floor(G.cat.aff)}/${CONFIG.cat.rideAff}` : G.mode === 'cat' ? 'En selle ! Vise l’armoire' : 'Monte sur Moustache (F)') },
  { id: 'carto', title: 'Cartographe', desc: 'Visite les 5 pièces et le jardin (la chatière s’ouvre à 40 d’affection avec Moustache).', check: () => Object.keys(G.visited).length >= 6, reward: { carte: 1 }, progress: () => `${Object.keys(G.visited).length}/6`, msg: 'Mini-carte débloquée !' },
  { id: 'base2', title: 'Résidence secondaire', desc: 'Fabrique un kit de base (boîte d’allumettes + coton + bouchon) et installe-le (clic droit) dans une cachette ≥ 50.', check: () => !!G.base2, reward: { sandwich: 1 } },
  { id: 'rosee', title: 'Rosée du matin', desc: 'Récolte 5 gouttes de rosée dans le jardin entre 5h et 9h.', check: () => G.counters.pickup_rosee >= 5, reward: { the: 2 }, progress: () => `${Math.min(5, G.counters.pickup_rosee || 0)}/5`, target: () => pos(600, 0, 1150) },
  { id: 'exotique', title: 'Cuisine exotique', desc: 'Attrape une fourmi près de la fourmilière du jardin et grille-la à l’établi (avec une allumette).', check: () => (G.counters.craft_fourmi_g || 0) >= 1, reward: { cube: 6 }, target: () => pos(250, 0, 1510) },
  { id: 'funambule', title: 'Funambule', desc: 'Atteins le sommet du frigo (180 cm). Indice : les cubes en bois… ou Moustache, qui bondit très haut.', check: () => G.flags.fridgeTop, reward: { bonbon: 3, barre: 1 }, target: () => pos(1160, 180, 463) },
  { id: 'meca', title: 'Mécanicien', desc: 'Installe une amélioration sur ta voiture à l’établi : silencieux ou pneus tout-terrain.', check: () => G.upgrades.silencieux || G.upgrades.pneus, reward: { cube: 4 } },
  { id: 'fan', title: 'Fan de cubes', desc: 'Des jouets et objets tout en cubes se cachent dans la maison et le jardin. Trouves-en 10 (interagis avec eux ou approche-toi).', check: () => Object.keys(G.egg.found).length >= 10, reward: { pomme_or: 1, bonbon: 2 }, progress: () => `${Object.keys(G.egg.found).length}/${EGG_COUNT}` },
  { id: 'roi', title: 'Le trésor du roi', desc: 'Léa construit un château fort Lego dans sa chambre. On dit qu’un roi y a caché son trésor… Regarde bien ses dessins et écoute-la jouer.', check: () => G.flags.legoChest, reward: { cube: 4 }, target: () => pos(289, 0, 336) },
  { id: 'bbq', title: 'Barbecue party', desc: 'Un chamallow géant se cache dans le jardin. Fais-le griller sur le barbecue de la terrasse quand il est chaud (un jour sur deux, de 12 h à 22 h) : grimpe par le sac de charbon et les bûches jusqu’à la tablette.', check: () => (G.counters.craft_festin || 0) >= 1, reward: { bonbon: 2 }, target: () => pos(1183, 54, 936) },
  { id: 'dompteur', title: 'Dompteur', desc: 'Distrais Rex en lançant (G) une croquette ou une balle près de lui.', check: () => (G.counters.dogDistracted || 0) >= 1, reward: { croquette: 2 }, target: () => (Dog ? pos(Dog.x, 50, Dog.z) : null) },
];
const DAILY = [
  { id: 'd_rosee', text: 'Bois 3 gouttes de rosée', ev: 'drink_rosee', goal: 3 },
  { id: 'd_varie', text: 'Mange 3 aliments différents', ev: 'variety', goal: 3 },
  { id: 'd_cuisine', text: 'Traverse la cuisine sans être repéré', ev: 'kitchenCross', goal: 1 },
  { id: 'd_route', text: 'Roule 30 m en voiture', ev: 'carDist', goal: 3000, unit: 'cm' },
  { id: 'd_caresse', text: 'Caresse Moustache 3 fois', ev: 'pet', goal: 3 },
  { id: 'd_ramasse', text: 'Ramasse 10 objets', ev: 'pickup', goal: 10 },
  { id: 'd_craft', text: "Fabrique 2 objets à l'établi", ev: 'craft', goal: 2 },
  { id: 'd_cubes', text: 'Pose 5 cubes en bois', ev: 'place', goal: 5 },
  { id: 'd_bubulle', text: 'Discute avec Bubulle', ev: 'talkFish', goal: 1 },
  { id: 'd_rex', text: 'Distrais Rex', ev: 'dogDistracted', goal: 1 },
  { id: 'd_saut', text: 'Saute 40 fois', ev: 'jump', goal: 40 },
  { id: 'd_jardin', text: 'Passe 2 heures (de jeu) dans le jardin', ev: 'gardenMin', goal: 120, unit: 'min' },
];
const DAILY_REWARDS = ['sandwich', 'barre', 'smoothie', 'fraise', 'jus', 'the', 'bonbon'];

const Missions = {
  newDay() {
    const pool = DAILY.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    G.daily = pool.map((d) => ({ id: d.id, n: 0, done: false }));
    G.dayEaten = {};
  },
  event(type, data = {}) {
    if (!G || !G.counters) return;
    const n = data.n || 1;
    G.counters[type] = (G.counters[type] || 0) + n;
    if (data.id) G.counters[type + '_' + data.id] = (G.counters[type + '_' + data.id] || 0) + n;
    if (type === 'eat' && data.id) { G.dayEaten[data.id] = 1; }
    for (const d of G.daily || []) {
      if (d.done) continue;
      const def = DAILY.find((q) => q.id === d.id);
      let inc = 0;
      if (def.ev === 'variety') { if (type === 'eat') d.n = Object.keys(G.dayEaten).length; }
      else if (def.ev === type) inc = n;
      else if (def.ev === type + '_' + data.id) inc = n;
      d.n += inc;
      if (d.n >= def.goal) {
        d.done = true;
        const it = pick(DAILY_REWARDS); giveItem(it, 1); G.stars++;
        toast(`⭐ Défi du jour réussi : ${def.text} (+${ITEMS[it].icon} ${ITEMS[it].name})`, 'success'); SFX.play('quest');
      }
    }
  },
  tick() {
    if (G.mainStep < MAIN.length) {
      const st = MAIN[G.mainStep];
      if (st.check()) {
        G.mainStep++;
        SFX.play('quest');
        if (G.mainStep < MAIN.length) toast(`✔ ${st.title} — nouvel objectif : ${MAIN[G.mainStep].title}`, 'success');
        if (st.id === 'envol') onVictory();
        UI.dirty = true;
      }
    }
    for (const q of SIDE) {
      if (G.side[q.id]) continue;
      if (q.req && !G.side[q.req]) continue;
      if (q.check()) {
        G.side[q.id] = 1;
        for (const k in q.reward || {}) giveItem(k, q.reward[k]);
        if (q.upgrade) G.upgrades[q.upgrade] = true;
        G.stars += 2;
        const rw = [...Object.keys(q.reward || {}).map((k) => ITEMS[k].icon), q.upgrade ? UPGRADES[q.upgrade].icon + ' ' + UPGRADES[q.upgrade].name : ''].filter(Boolean).join(' ');
        toast(`🏅 Quête terminée : ${q.title} ${rw ? '— récompense : ' + rw : ''}`, 'success');
        if (q.msg) toast(q.msg, 'info');
        if (q.id === 'bague') G.mood = 1;
        if (G.track === q.id) G.track = null;
        SFX.play('quest'); UI.dirty = true;
      }
    }
  },
  current() {
    return this.list()[0];
  },
  // Jusqu'à 5 missions : suivie, principale, secondaires en cours, défis du jour
  list() {
    const out = [];
    if (G.track) { const q = SIDE.find((s) => s.id === G.track); if (q && !G.side[q.id]) out.push({ kind: '📌', title: q.title, desc: q.desc, target: q.target ? q.target() : null, progress: q.progress ? q.progress() : '' }); }
    if (G.mainStep < MAIN.length) { const st = MAIN[G.mainStep]; out.push({ kind: '⭐', title: st.title, desc: st.desc, target: st.target(), progress: st.progress ? st.progress() : '' }); }
    else if (!out.length) out.push({ kind: '🏡', title: 'Jeu libre', desc: 'La colonie est fondée ! Termine les quêtes secondaires et les défis du jour.', target: null, progress: '' });
    for (const q of SIDE) {
      if (out.length >= 4) break;
      if (G.side[q.id] || q.id === G.track || (q.req && !G.side[q.req])) continue;
      out.push({ kind: '•', title: q.title, desc: q.desc, target: q.target ? q.target() : null, progress: q.progress ? q.progress() : '' });
    }
    for (const d of G.daily || []) {
      if (out.length >= 5) break;
      if (d.done) continue;
      const def = DAILY.find((x) => x.id === d.id);
      out.push({ kind: '☀️', title: def.text, desc: 'Défi du jour', target: null, progress: def.unit === 'cm' ? `${fmtDist(d.n)} / ${fmtDist(def.goal)}` : `${Math.floor(d.n)}/${def.goal}` });
    }
    return out.slice(0, 5);
  },
};
