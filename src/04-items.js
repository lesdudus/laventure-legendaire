// ------------------------------ OBJETS ------------------------------
const ITEMS = {
  miette: { name: 'Miette de croissant', icon: '🥐', type: 'food', eff: { nour: 8 }, desc: 'Croustillante et beurrée. Un festin à ton échelle.', mesh: ['box', 0xd9a35b, 1.7] },
  riz: { name: 'Grain de riz', icon: '🍚', type: 'food', eff: { nour: 5 }, desc: 'Petit mais nourrissant.', mesh: ['grain', 0xf5f5f0, 1.1] },
  cereale: { name: 'Flocon de céréale géant', icon: '🥣', type: 'food', eff: { nour: 8 }, desc: 'Un flocon doré grand comme un frisbee. Bubulle en raffole.', mesh: ['flake', 0xe0a040, 3] },
  pois: { name: 'Petit pois', icon: '🟢', type: 'food', eff: { nour: 6 }, desc: 'A roulé sous la table au dîner.', mesh: ['ball', 0x6abf40, 1] },
  raisin: { name: 'Raisin sec', icon: '🍇', type: 'food', eff: { nour: 6, energie: 4 }, desc: 'Sucré et ridé.', mesh: ['ball', 0x5a2a3a, 1] },
  myrtille: { name: 'Myrtille', icon: '🫐', type: 'food', eff: { nour: 7, energie: 10 }, desc: "Une boule d'énergie bleue.", mesh: ['ball', 0x3b4cc0, 1.2] },
  fromage: { name: 'Bout de fromage râpé', icon: '🧀', type: 'food', eff: { nour: 9 }, desc: 'Le chat adore aussi.', mesh: ['box', 0xf7d046, 1.6], catFood: 14 },
  chips: { name: 'Éclat de chips', icon: '🥔', type: 'food', eff: { nour: 8 }, desc: 'Délicieux mais salé… et TRÈS bruyant à croquer.', mesh: ['flake', 0xf2c14e, 2.6], noisy: true },
  bonbon: { name: 'Bonbon chocolaté', icon: '🍫', type: 'food', eff: { nour: 5, energie: 30 }, desc: 'Énergie immédiate… puis coup de fatigue.', mesh: ['ball', 0x8e44ad, 1.3], crash: true },
  croquette: { name: 'Croquette du chat', icon: '🦴', type: 'food', eff: { nour: 8 }, desc: 'À croquer, à offrir au chat ou à lancer (G) pour distraire Rex.', mesh: ['box', 0x8b5a2b, 1.2], throwable: true, catFood: 16 },
  graine: { name: 'Graine de tournesol', icon: '🌻', type: 'food', eff: { nour: 6 }, desc: 'Tombée du grand tournesol.', mesh: ['grain', 0x3a3a3a, 1.4] },
  fraise: { name: 'Fraise du potager', icon: '🍓', type: 'food', eff: { nour: 10 }, desc: 'Rare et énorme. Un vrai trésor.', mesh: ['ball', 0xd32f2f, 2.2] },
  fourmi_g: { name: 'Fourmi grillée', icon: '🍢', type: 'food', eff: { nour: 50, energie: 5 }, desc: 'Cuisine exotique. Croustillante !' },
  sandwich: { name: 'Sandwich-miette', icon: '🥪', type: 'food', eff: { nour: 45 }, desc: 'Deux miettes et du fromage. Gastronomie miniature.' },
  barre: { name: 'Barre énergétique', icon: '🍬', type: 'food', eff: { nour: 40, energie: 35 }, desc: 'Céréale + miel. Le carburant des aventuriers.' },
  miel: { name: 'Goutte de miel', icon: '🍯', type: 'food', eff: { nour: 5, energie: 12 }, desc: 'Collante et sucrée.', mesh: ['drop', 0xe0a030, 1.3] },
  rosee: { name: 'Goutte de rosée', icon: '💧', type: 'drink', eff: { nour: 6 }, desc: 'Fraîche, dans le jardin le matin (5h–9h).', mesh: ['drop', 0x9fd8ff, 1.2] },
  robinet: { name: 'Goutte du robinet', icon: '🚰', type: 'drink', eff: { nour: 5 }, desc: 'Le lavabo de la salle de bain fuit. Merci la plomberie !', mesh: ['drop', 0x7ec8f0, 1.2] },
  eau_bouchon: { name: 'Eau dans un bouchon', icon: '🧴', type: 'drink', eff: { nour: 8 }, desc: "Un bouchon rempli d'eau : une vraie gourde.", back: 'bouchon' },
  lait: { name: 'Lait renversé', icon: '🥛', type: 'drink', eff: { nour: 8 }, desc: 'Reste du petit-déjeuner (8h–12h).', mesh: ['drop', 0xfdfdfd, 1.7], catFood: 18 },
  jus: { name: "Jus d'orange (dé à coudre)", icon: '🍊', type: 'drink', eff: { nour: 8, energie: 5 }, desc: 'Servi dans un dé à coudre.', mesh: ['cup', 0xf39c12, 1.5] },
  the: { name: 'Thé froid', icon: '🧊', type: 'drink', eff: { nour: 7, energie: 12 }, desc: 'Une goutte de thé glacé. Ça réveille !', mesh: ['drop', 0xc0712a, 1.3] },
  soda: { name: 'Soda pétillant', icon: '🥤', type: 'drink', eff: { nour: 7, energie: 8 }, desc: 'Pétille… et donne un hoquet bruyant.', mesh: ['drop', 0x6d3b1f, 1.3], hiccup: true },
  eau_chien: { name: 'Eau de la gamelle', icon: '🐶', type: 'drink', eff: { nour: 8 }, desc: "Beaucoup d'eau, mais ça sent le chien…" },
  smoothie: { name: 'Smoothie myrtille-rosée', icon: '🧃', type: 'drink', eff: { nour: 45, energie: 10 }, desc: 'Le cocktail du jardin.' },
  feuille: { name: 'Feuille de papier', icon: '📄', type: 'mat', desc: "Pour l'avion en papier.", mesh: ['sheet', 0xffffff, 5], quest: true },
  elastique: { name: 'Élastique', icon: '➰', type: 'mat', desc: "Moteur d'avion, pneus… très utile.", mesh: ['ring', 0xd35400, 2.2] },
  trombone: { name: 'Trombone', icon: '📎', type: 'mat', desc: 'Structure métallique légère.', mesh: ['clip', 0xb0b6bb, 2.6] },
  pile: { name: 'Pile', icon: '🔋', type: 'mat', desc: 'Une pile bien chargée.', mesh: ['cyl', 0x37474f, 2] },
  allumette: { name: 'Allumette', icon: '🔥', type: 'mat', desc: 'Pour cuisiner à l’établi.', mesh: ['stick', 0xe8c08a, 4] },
  mouchoir: { name: 'Mouchoir', icon: '🧻', type: 'mat', desc: 'Doux et léger : parfait pour un parachute.', mesh: ['box', 0xf7f7f7, 3] },
  fil: { name: 'Bobine de fil', icon: '🧵', type: 'mat', desc: 'Du fil à coudre.', mesh: ['cyl', 0x1976d2, 2] },
  coton: { name: 'Boule de coton', icon: '☁️', type: 'mat', desc: 'Moelleux. Étouffe les bruits.', mesh: ['ball', 0xffffff, 2.2] },
  bouchon: { name: 'Bouchon vide', icon: '🔘', type: 'mat', desc: "À remplir (E) à un point d'eau : fuite, gamelle, flaque.", mesh: ['cyl', 0x1e88e5, 2] },
  boite: { name: "Boîte d'allumettes vide", icon: '📦', type: 'mat', desc: 'Une maison toute faite.', mesh: ['box', 0x2f5d8a, 4] },
  fourmi: { name: 'Fourmi', icon: '🐜', type: 'mat', desc: "À griller à l'établi avec une allumette.", mesh: ['box', 0x1a1a1a, 0.9] },
  bague: { name: 'Bague dorée', icon: '💍', type: 'quest', desc: 'Elle appartient à Marc. Dépose-la sur sa table de nuit (chambre).', quest: true, stack: 1 },
  cube: { name: 'Cube en bois', icon: '🧱', type: 'block', desc: 'Clic droit : poser (10 cm). Clic gauche : récupérer.', stack: 20, mesh: ['cube', 0xd9a441, 4] },
  balle: { name: 'Balle rebondissante', icon: '⚾', type: 'tool', desc: 'Lance-la (G) pour occuper Rex.', mesh: ['ball', 0xe53935, 2.4], throwable: true },
  parachute: { name: 'Parachute (mouchoir)', icon: '🪂', type: 'tool', desc: 'Maintiens Espace en chute pour planer : plus de dégâts de chute.', stack: 1 },
  kit_base: { name: 'Kit de base', icon: '🏕️', type: 'tool', desc: 'Clic droit : installer une 2e base ici (cachette ≥ 50).', stack: 1 },
  avion: { name: 'Avion en papier motorisé', icon: '✈️', type: 'tool', desc: 'Lance-le (E) depuis le rebord de la fenêtre du salon ou un point haut du jardin.', stack: 1, quest: true },
  pomme_or: { name: 'Pomme dorée', icon: '🍎', type: 'food', eff: { nour: 10, vie: 50, energie: 20 }, desc: 'Légendaire : rend aussi de la vie.', mesh: ['ball', 0xf5c518, 2.4] },
  carte: { name: 'Carte de la maison', icon: '🗺️', type: 'tool', desc: 'Affiche la mini-carte.', stack: 1 },
  pioche: { name: 'Pioche en diamant (jouet)', icon: '⛏️', type: 'tool', stack: 1, desc: 'Un jouet cubique… qui permet vraiment de miner le bloc de minerai du jardin !', mesh: ['pick', 0x4fe3d6, 5] },
  epee: { name: 'Épée en diamant (jouet)', icon: '🗡️', type: 'tool', stack: 1, desc: 'Tiens-la en main (barre rapide) : Rex recule au lieu de mordre.', mesh: ['sword', 0x4fe3d6, 6] },
  diamant: { name: 'Diamant', icon: '💎', type: 'mat', desc: 'Miné dans le jardin. Bubulle adore ce qui brille…', mesh: ['gem', 0x4fe3d6, 1.8] },
  sandwich_simple: { name: 'Sandwich simple', icon: '🥯', type: 'food', eff: { nour: 25 }, desc: 'Miette + fromage, assemblés à la main. Plus nourrissant que les deux séparément.' },
  eau_miel: { name: 'Eau miellée', icon: '🍵', type: 'drink', eff: { nour: 30, energie: 16 }, desc: 'Une goutte d’eau sucrée au miel : un vrai remontant.' },
  mix_graines: { name: 'Mélange du randonneur', icon: '🥜', type: 'food', eff: { nour: 30, energie: 10 }, desc: 'Raisin sec et graine de tournesol. Léger et énergétique.' },
  brochette: { name: 'Brochette de myrtilles', icon: '🍡', type: 'food', eff: { nour: 35, energie: 20 }, desc: 'Deux myrtilles piquées sur une allumette.' },
  compresse: { name: 'Compresse', icon: '🩹', type: 'food', eff: { vie: 30 }, desc: 'Un bout de mouchoir humide : soigne les morsures et les chutes.' },
  part_gateau: { name: "Part de gâteau d'anniversaire", icon: '🍰', type: 'food', eff: { nour: 10, energie: 15 }, desc: 'Tombée de l’assiette de Léa. Chantilly incluse.', mesh: ['box', 0xfde2e4, 2.2] },
  armure: { name: 'Armure en capsules', icon: '🛡️', type: 'tool', stack: 1, desc: 'Clic droit pour l’enfiler ou l’enlever. Les morsures de Rex font 75 % de dégâts en moins. S’use après 5 morsures.' },
  couronne: { name: 'Couronne du roi Lego', icon: '👑', type: 'tool', stack: 1, desc: 'Trésor du château de Léa. Tant qu’elle est dans ton inventaire, les humains t’oublient deux fois plus vite.' },
  voiture: { name: 'Voiture (rangée)', icon: '🚗', type: 'tool', stack: 1, keep: true, desc: 'Ta Cruise Bruiser, rangée dans ta poche. Clic droit pour la poser devant toi.' },
  tenue_invis: { name: "Tenue d'invisibilité", icon: '🫥', type: 'tool', stack: 1, keep: true, desc: 'Clic droit pour l’activer ou la couper. Elle fonctionne avec un Cristal d’ombre 🔮 (4 h de jeu par cristal). Les humains et Rex ne te voient plus… mais ils t’entendent toujours.' },
  cristal: { name: "Cristal d'ombre", icon: '🔮', type: 'mat', stack: 4, desc: 'Énergie de la tenue d’invisibilité : 4 h de jeu par cristal. Tu peux en garder 4 au maximum.', mesh: ['gem', 0x7e57c2, 2.2], halo: [0xb388ff, 9], float: 3 },
  chamallow: { name: 'Chamallow géant', icon: '🍥', type: 'mat', desc: 'Tout moelleux, gros comme toi. Il paraît qu’il est bien meilleur grillé…', mesh: ['box', 0xfbe3ef, 2.8] },
  festin: { name: 'Festin du barbecue', icon: '🍖', type: 'food', eff: { nour: 100, energie: 20 }, feast: true, desc: 'Un chamallow grillé à point : ta Nourriture est pleine et reste à 100 % pendant 1 jour de jeu !' },
  ailerons: { name: "Kit d'ailerons (rare)", icon: '🪽', type: 'tool', stack: 1, desc: 'Clic droit pour l’installer sur la voiture : en l’air, maintiens Espace pour planer.', mesh: ['box', 0xff7a00, 3] },
};
// Indices subtils affichés dans la fiche de l'inventaire
const HINTS = {
  miette: 'Marc grignote toujours un croissant à son bureau…', riz: 'Ça roule souvent au pied des placards de la cuisine.', cereale: 'Bubulle ne dit jamais non à un flocon.',
  pois: 'Le dîner laisse des traces sous la table.', raisin: 'Les coussins du canapé cachent bien des choses.', myrtille: 'Un buisson bleu pousse au fond du jardin.',
  fromage: 'Moustache t’aimera encore plus si tu partages.', chips: 'Croustillant = bruyant. À manger loin des oreilles humaines.', bonbon: 'L’énergie arrive vite… et repart aussi vite.',
  croquette: 'Lancée au bon moment, elle peut te sauver de Rex.', graine: 'Le grand tournesol en laisse tomber chaque jour.', fraise: 'Le potager du jardin en cache parfois.',
  fourmi_g: 'Un four-jouet pourrait remplacer l’allumette…', sandwich: 'La version de l’établi est encore plus copieuse que celle faite à la main.', barre: 'Céréale + miel… l’établi fait le reste.',
  miel: 'Un pot ambré trône sur le plan de travail.', rosee: 'Le jardin au petit matin, avant 9 h.', robinet: 'Ça goutte sous le lavabo de la salle de bain.',
  eau_bouchon: 'Une gourde qui se remplit à n’importe quel point d’eau.', lait: 'Le petit-déjeuner laisse parfois une flaque blanche.', jus: 'Il faut grimper sur le plan de travail.',
  the: 'Un verre traîne souvent sur la table de la cuisine.', soda: 'Pétille dans la gorge… et dans les oreilles des voisins.', eau_chien: 'Rex n’aime pas partager.',
  smoothie: 'Myrtille et rosée font bon ménage.', feuille: 'Une pièce de l’avion de papier.', elastique: 'Élastique, il propulse et il protège.',
  trombone: 'Du métal plié : armures, avions, périscopes…', pile: 'De l’énergie en conserve.', allumette: 'Bâton, broche ou feu de cuisine.',
  mouchoir: 'Doux, léger, absorbant : à la fois parachute et pansement.', fil: 'Pour coudre, tisser, attacher.', coton: 'Étouffe les bruits… et les chocs.',
  bouchon: 'Une capsule bien solide : gourde, armure, garde-manger.', boite: 'Une boîte vide est une maison qui attend.', fourmi: 'À griller, à l’établi ou ailleurs…',
  bague: 'Marc la cherche partout depuis des semaines.', cube: 'Saute, pose un cube sous tes pieds, recommence.', balle: 'Rex court après tout ce qui rebondit.',
  parachute: 'Saute de haut sans crainte.', kit_base: 'Une cachette ≥ 50 suffit pour s’installer.', avion: 'La lucarne de la cabane t’attend.', carte: 'Mieux vaut savoir où l’on va.',
  pioche: 'Un bloc de pierre bleutée dort près de la fourmilière.', epee: 'Les chiens respectent les épées… même en plastique.', diamant: 'Les poissons adorent ce qui brille.',
  pomme_or: 'Légendaire. Garde-la pour les coups durs.', sandwich_simple: 'Avec un peu plus d’outils, on fait mieux.', eau_miel: 'Le sucre réveille, l’eau désaltère.',
  mix_graines: 'Idéal avant une longue expédition.', brochette: 'Une allumette peut servir à autre chose qu’à faire du feu.', compresse: 'Chaque morsure mérite un pansement.',
  part_gateau: 'Les fêtes laissent toujours des miettes.', armure: 'Cinq morsures, pas une de plus.', ailerons: 'Tout en haut du frigo, dit-on…', couronne: 'Un vrai roi sait se faire oublier.', voiture: 'Une voiture de poche, pratique pour les longs trajets.', tenue_invis: 'Invisible ne veut pas dire silencieux.',
  cristal: 'Un nouveau brille chaque matin quelque part dans la maison.', chamallow: 'Des braises bien chaudes le rendraient irrésistible.', festin: 'Une journée entière sans avoir faim ni soif.',
};
const TYPE_ORDER = { food: 0, drink: 1, block: 2, tool: 3, mat: 4, quest: 5 };
const UPGRADES = {
  silencieux: { name: 'Silencieux', icon: '🔇', desc: 'Voiture 50 % plus discrète.' },
  pneus: { name: 'Pneus tout-terrain', icon: '🛞', desc: "Plus de ralentissement dans l'herbe." },
  turbo: { name: 'Turbo', icon: '🚀', desc: 'Vitesse maximale +22 %.' },
  ailerons: { name: 'Ailerons', icon: '🪽', desc: 'En l’air, maintiens Espace pour planer.' },
};
// where : 'main' (dans l'inventaire) ou 'atelier' (à l'établi). start : connue dès le début.
const RECIPES = [
  { out: 'sandwich_simple', n: 1, in: { miette: 1, fromage: 1 }, where: 'main', start: true },
  { out: 'compresse', n: 1, in: { mouchoir: 1, rosee: 1 }, where: 'main', start: true },
  { out: 'eau_miel', n: 1, in: { robinet: 1, miel: 1 }, where: 'main' },
  { out: 'mix_graines', n: 1, in: { raisin: 1, graine: 1 }, where: 'main' },
  { out: 'brochette', n: 1, in: { myrtille: 2, allumette: 1 }, where: 'main' },
  { out: 'sandwich', n: 1, in: { miette: 2, fromage: 1 } },
  { out: 'smoothie', n: 1, in: { myrtille: 1, rosee: 2 } },
  { out: 'barre', n: 1, in: { cereale: 1, miel: 1 } },
  { out: 'fourmi_g', n: 1, in: { fourmi: 1, allumette: 1 } },
  { out: 'parachute', n: 1, in: { mouchoir: 1, fil: 1 } },
  { out: 'armure', n: 1, in: { bouchon: 2, trombone: 1, fil: 1 } },
  { out: 'kit_base', n: 1, in: { boite: 1, coton: 1, bouchon: 1 } },
  { out: 'avion', n: 1, in: { feuille: 1, elastique: 1, trombone: 1, pile: 1 } },
  { out: 'festin', n: 1, in: { chamallow: 1 }, where: 'bbq' },
  { up: 'silencieux', in: { coton: 1, bouchon: 1 } },
  { up: 'pneus', in: { elastique: 2 } },
  { base: 'tapis', in: { mouchoir: 1, fil: 1 } },
  { base: 'garde_manger', in: { boite: 1, cereale: 1, bouchon: 1 } },
  { base: 'recuperateur', in: { bouchon: 2, trombone: 1 } },
  { base: 'vitrine', in: { cube: 3, diamant: 1 } },
  { base: 'periscope', in: { trombone: 1, bouchon: 1, allumette: 2 } },
  { base: 'garage', in: { elastique: 1, cube: 4 } },
];
const recipeWhere = (r) => r.where || 'atelier';
function recipeInfo(r) {
  if (r.up) return { name: UPGRADES[r.up].name + ' (voiture)', icon: UPGRADES[r.up].icon, desc: UPGRADES[r.up].desc };
  if (r.base) return { name: BASE_UPS[r.base].name + ' (base)', icon: BASE_UPS[r.base].icon, desc: BASE_UPS[r.base].desc };
  return { name: ITEMS[r.out].name, icon: ITEMS[r.out].icon, desc: ITEMS[r.out].desc };
}
const recipeKey = (r) => r.out || 'up_' + (r.up || '') + (r.base ? 'base_' + r.base : '');
function recipeUnlocked(r) { return !!(r.start || (G.known && Object.keys(r.in).every((k) => G.known[k]))); }
function recipeDone(r) { return (r.up && G.upgrades[r.up]) || (r.base && G.baseUp && G.baseUp[r.base]); }
let onOwned = null;

class Inventory {
  constructor(n) { this.slots = new Array(n).fill(null); }
  max(id) { return ITEMS[id].stack || CONFIG.stack; }
  count(id) { let c = 0; for (const s of this.slots) if (s && s.id === id) c += s.n; return c; }
  has(req) { for (const k in req) if (this.count(k) < req[k]) return false; return true; }
  add(id, n = 1) {
    if (onOwned) onOwned(id);
    const mx = this.max(id);
    for (const s of this.slots) if (s && s.id === id && s.n < mx) { const k = Math.min(n, mx - s.n); s.n += k; n -= k; if (!n) return 0; }
    for (let i = 0; i < this.slots.length; i++) if (!this.slots[i]) { const k = Math.min(n, mx); this.slots[i] = { id, n: k }; n -= k; if (!n) return 0; }
    return n;
  }
  remove(id, n = 1) {
    if (this.count(id) < n) return false;
    for (let i = this.slots.length - 1; i >= 0 && n > 0; i--) {
      const s = this.slots[i];
      if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (!s.n) this.slots[i] = null; }
    }
    return true;
  }
  takeAt(i, n = 1) { const s = this.slots[i]; if (!s) return null; const k = Math.min(n, s.n); s.n -= k; if (!s.n) this.slots[i] = null; return { id: s.id, n: k }; }
  sort() {
    const tot = {};
    for (const s of this.slots) if (s) tot[s.id] = (tot[s.id] || 0) + s.n;
    this.slots.fill(null);
    Object.keys(tot).sort((a, b) => (TYPE_ORDER[ITEMS[a].type] - TYPE_ORDER[ITEMS[b].type]) || ITEMS[a].name.localeCompare(ITEMS[b].name)).forEach((id) => this.add(id, tot[id]));
  }
  load(arr) { this.slots = this.slots.map((_, i) => (arr && arr[i] && ITEMS[arr[i].id] ? { id: arr[i].id, n: arr[i].n } : null)); }
}

// ------------------------------ MAILLAGES D'OBJETS ------------------------------
const _itemGeo = {}, _itemMat = {};
let CUBE_MATS = null;
function cubeMaterials() {
  if (CUBE_MATS) return CUBE_MATS;
  CUBE_MATS = [0xd9534f, 0x2f7dc1, 0xf2c94c, 0x4caf50].map((c, i) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 32;
    const g = cv.getContext('2d');
    g.fillStyle = '#' + c.toString(16).padStart(6, '0'); g.fillRect(0, 0, 32, 32);
    g.fillStyle = '#f7ecd5'; g.fillRect(3, 3, 26, 26);
    g.fillStyle = '#' + c.toString(16).padStart(6, '0'); g.font = 'bold 20px Segoe UI, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('ABCD'[i], 16, 17);
    const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshLambertMaterial({ map: t });
  });
  return CUBE_MATS;
}
function itemMesh(id) {
  const def = ITEMS[id].mesh || ['box', 0xcccccc, 2];
  const [shape, color, s] = def;
  if (shape === 'pick' || shape === 'sword') {
    const H = 0x8d6e4f, D = 0x2b5f5a;
    const parts = shape === 'pick'
      ? [[-0.25, -s / 2, -0.25, 0.25, s / 2, 0.25, H], [-s / 2.4, s / 2 - 0.6, -0.3, s / 2.4, s / 2, 0.3, color], [-s / 2.4, s / 2 - 1, -0.3, -s / 2.4 + 0.6, s / 2 - 0.6, 0.3, color], [s / 2.4 - 0.6, s / 2 - 1, -0.3, s / 2.4, s / 2 - 0.6, 0.3, color]]
      : [[-0.25, -s / 2, -0.25, 0.25, -s / 2 + 1.4, 0.25, H], [-1, -s / 2 + 1.4, -0.3, 1, -s / 2 + 1.8, 0.3, D], [-0.45, -s / 2 + 1.8, -0.2, 0.45, s / 2, 0.2, color]];
    const m = meshBoxes(parts, 'plain'); m.rotation.z = 0.6; return m;
  }
  if (shape === 'gem' && !_itemGeo[id]) { _itemGeo[id] = new THREE.OctahedronGeometry(s / 2, 0); _itemMat[id] = new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.35), flatShading: true }); }
  if (!_itemGeo[id]) {
    let g;
    switch (shape) {
      case 'ball': g = new THREE.IcosahedronGeometry(s / 2, 1); break;
      case 'drop': g = new THREE.IcosahedronGeometry(s / 2, 1); break;
      case 'grain': g = new THREE.BoxGeometry(s, s * 0.45, s * 0.45); break;
      case 'flake': g = new THREE.BoxGeometry(s, s * 0.18, s * 0.85); break;
      case 'sheet': g = new THREE.BoxGeometry(s, 0.2, s * 1.3); break;
      case 'ring': g = new THREE.TorusGeometry(s / 2, 0.22, 4, 12); g.rotateX(Math.PI / 2); break;
      case 'clip': g = new THREE.TorusGeometry(s / 3, 0.12, 3, 8); g.scale(1, 1.7, 1); g.rotateX(Math.PI / 2); break;
      case 'cyl': g = new THREE.CylinderGeometry(s / 2, s / 2, s * 0.55, 10); break;
      case 'stick': g = new THREE.BoxGeometry(s, 0.4, 0.4); break;
      case 'cup': g = new THREE.CylinderGeometry(s / 2, s / 2.4, s, 10); break;
      default: g = new THREE.BoxGeometry(s, s * 0.8, s);
    }
    _itemGeo[id] = g;
    const c = new THREE.Color(color);
    _itemMat[id] = shape === 'drop'
      ? new THREE.MeshLambertMaterial({ color: c, transparent: true, opacity: 0.8, emissive: c.clone().multiplyScalar(0.25) })
      : new THREE.MeshLambertMaterial({ color: c, emissive: c.clone().multiplyScalar(0.18), flatShading: true });
  }
  if (shape === 'cube') { const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), cubeMaterials()[0]); return m; }
  const m = new THREE.Mesh(_itemGeo[id], _itemMat[id]);
  if (shape === 'stick') m.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), new THREE.MeshLambertMaterial({ color: 0xc0392b })).translateX(s / 2));
  return m;
}
const itemHalfH = (id) => { const d = ITEMS[id].mesh; if (!d) return 1; const s = d[2]; return ({ flake: s * 0.09, sheet: 0.1, ring: 0.22, clip: 0.12, stick: 0.2, grain: s * 0.22 })[d[0]] ?? s * 0.45; };

// ------------------------------ POINTS D'APPARITION ------------------------------
const SPAWNS = [];
function sp(id, x, y, z, re, o = {}) { SPAWNS.push({ id, x, y, z, re, n: o.n || 1, win: o.win || null, once: re === 0, pk: null, next: 0, done: false }); }
function defineSpawns() {
  sp('miette', 850, 0, 80, 8); sp('miette', 905, 0, 112, 8); sp('miette', 960, 0, 130, 8); sp('miette', 840, 80, 80, 12);
  sp('feuille', 955, 75, 85, 0); sp('trombone', 820, 0, 365, 0); sp('boite', 1140, 0, 320, 72);
  sp('allumette', 122, 55, 50, 48); sp('allumette', 128, 55, 60, 48);
  sp('mouchoir', 60, 0, 215, 48); sp('fil', 318, 0, 240, 48); sp('balle', 220, 0, 130, 48);
  sp('cube', 140, 0, 362, 24, { n: 2 }); sp('cube', 140, 0, 385, 24, { n: 2 }); sp('cube', 236, 0, 352, 24, { n: 2 }); sp('cube', 236, 0, 392, 24, { n: 2 });
  sp('robinet', 680, 0.3, 225, 2); sp('robinet', 692, 0.3, 185, 2);
  sp('coton', 495, 0.3, 312, 48); sp('coton', 585, 0.3, 340, 48); sp('bouchon', 630, 0.3, 285, 48);
  sp('pile', 310, 0, 452, 0);
  sp('raisin', 230, 0, 800, 24); sp('raisin', 300, 0, 790, 24);
  sp('bonbon', 240, 43, 655, 24); sp('bonbon', 295, 43, 640, 24); sp('myrtille', 270, 43, 668, 24);
  sp('cube', 200, 0.8, 560, 24, { n: 2 }); sp('cube', 330, 0.8, 700, 24, { n: 2 }); sp('cube', 390, 0.8, 540, 24);
  sp('balle', 455, 0, 670, 48); sp('miette', 330, 0, 748, 12);
  sp('croquette', 598, 4, 552, 6); sp('croquette', 606, 4, 559, 6); sp('croquette', 613, 4, 551, 6);
  sp('cereale', 900, 0.3, 765, 12); sp('cereale', 790, 0.3, 590, 12);
  sp('chips', 1060, 0.3, 500, 24); sp('soda', 1028, 0.3, 488, 24);
  sp('lait', 870, 0.3, 588, 24, { win: [8, 12] });
  sp('fromage', 1105, 0.3, 515, 12); sp('fromage', 1112, 0.3, 545, 12);
  sp('pois', 840, 0.3, 650, 24); sp('pois', 900, 0.3, 640, 24);
  sp('riz', 1125, 0.3, 600, 12); sp('riz', 1120, 0.3, 645, 12); sp('riz', 1127, 0.3, 705, 12);
  sp('jus', 1158, 90, 662, 24); sp('miel', 1148, 90, 798, 24); sp('the', 900, 75, 620, 24);
  sp('elastique', 830, 75, 680, 0); sp('elastique', 1120, 0.3, 770, 48);
  const r = mulberry32(5);
  for (let i = 0; i < 12; i++) {
    let x, z;
    do { x = -60 + r() * 1300; z = 900 + r() * 700; } while (onPath(x, z) || (x > 95 && x < 405 && z > 1145 && z < 1255) || (x > 940 && z > 1370) || (x > 480 && x < 730 && z > 990 && z < 1090));
    sp('rosee', x, 0, z, 24, { win: [5, 9] });
  }
  sp('graine', 515, 0, 1312, 24); sp('graine', 485, 0, 1318, 24); sp('graine', 506, 0, 1326, 24); sp('graine', 492, 0, 1288, 24);
  sp('fraise', 180, 17, 1200, 48); sp('fraise', 320, 17, 1222, 48);
  sp('fourmi', 210, 0, 1470, 6); sp('fourmi', 292, 0, 1500, 6); sp('fourmi', 250, 0, 1556, 6);
  sp('myrtille', 688, 0, 1518, 24); sp('myrtille', 758, 0, 1548, 24); sp('myrtille', 722, 0, 1602, 24);
  sp('pioche', 248, 0, 382, 0); sp('epee', 650, 72, 1040, 0); sp('pomme_or', 370, 215, 330, 72);
  sp('trombone', 1180, 0, 380, 48); sp('trombone', 760, 0.3, 470, 48); sp('bouchon', 1000, 0.3, 560, 48); sp('fil', 125, 0, 405, 48);
  // récompenses des propulseurs : toit de l'aquarium (facile) et dessus du frigo (difficile)
  sp('diamant', 30, 97, 700, 48); sp('bonbon', 42, 97, 765, 24); sp('ailerons', 1160, 180, 470, 0);
  // chamallow géant, caché sous la table du jardin (réapparaît tous les 2 jours)
  sp('chamallow', 694, 0, 1068, 48);
}
const spawnKey = (s) => `${s.id}@${Math.round(s.x)},${Math.round(s.z)}`;

// ------------------------------ OBJETS AU SOL ------------------------------
const PICKUPS = [];
// petit halo lumineux (objets rares au sol) : visible la nuit, masqué par les murs et les meubles
const HALO_MATS = new Map();
let _haloTex = null;
function haloMaterial(color) {
  if (HALO_MATS.has(color)) return HALO_MATS.get(color);
  if (!_haloTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    _haloTex = new THREE.CanvasTexture(c); _haloTex.colorSpace = THREE.SRGBColorSpace;
  }
  const m = new THREE.SpriteMaterial({ map: _haloTex, color, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  HALO_MATS.set(color, m);
  return m;
}
function spawnPickup(id, n, x, y, z, spawn = null, vel = null) {
  const mesh = itemMesh(id);
  const halo = ITEMS[id].halo;
  if (halo) { const h = new THREE.Sprite(haloMaterial(halo[0])); h.scale.setScalar(halo[1]); mesh.add(h); }
  const p = { id, n, x, y, z, mesh, spawn, vel, t: Math.random() * 6, thrown: !!vel, landed: !vel };
  mesh.position.set(x, y + itemHalfH(id), z);
  W.scene.add(mesh); PICKUPS.push(p);
  if (spawn) spawn.pk = p;
  return p;
}
function removePickup(p) {
  const i = PICKUPS.indexOf(p); if (i >= 0) PICKUPS.splice(i, 1);
  W.scene.remove(p.mesh);
  if (p.spawn) { p.spawn.pk = null; if (p.spawn.once) p.spawn.done = true; else p.spawn.next = G.time + p.spawn.re * 60; }
}
const winOk = (w, h) => !w || (h >= w[0] && h < w[1]);
function updateSpawns() {
  const h = G.hour;
  for (const s of SPAWNS) {
    if (s.done) continue;
    if (s.pk) {
      if (s.win && !winOk([s.win[0], s.win[1] + 0.5], h)) { const p = s.pk; removePickup(p); s.next = G.time + 60; }
      continue;
    }
    if (G.time >= s.next && winOk(s.win, h)) spawnPickup(s.id, s.n, s.x, s.y, s.z, s);
  }
}
function updatePickups(dt) {
  if (HALO_MATS.size) { const k = 0.7 + 0.25 * Math.sin(G.simT * 2.6); for (const m of HALO_MATS.values()) m.opacity = k; }
  for (const p of PICKUPS) {
    p.t += dt;
    if (p.thrown && !p.landed) {
      p.vel.y -= CONFIG.gravity * dt;
      const nx = p.x + p.vel.x * dt, nz = p.z + p.vel.z * dt, ny = p.y + p.vel.y * dt;
      const hit = raycast(p.x, p.y + 0.5, p.z, Math.sign(nx - p.x) || 1e-6, 0, 0, Math.abs(nx - p.x) + 0.5) || raycast(p.x, p.y + 0.5, p.z, 0, 0, Math.sign(nz - p.z) || 1e-6, Math.abs(nz - p.z) + 0.5);
      if (hit) { p.vel.x *= -0.3; p.vel.z *= -0.3; } else { p.x = nx; p.z = nz; }
      const g = groundAt(p.x, p.z, 0.3, p.y + 0.5);
      p.y = ny;
      if (p.y <= g) {
        p.y = g;
        if (Math.abs(p.vel.y) > 120 && p.id === 'balle') { p.vel.y *= -0.55; p.vel.x *= 0.7; p.vel.z *= 0.7; SFX.at('thud', p.x, p.y, p.z, 400, 0.5); }
        else { p.landed = true; p.vel = null; emitNoise(p.x, p.y, p.z, 160, 0.45, 'objet'); SFX.at('thud', p.x, p.y, p.z, 400, 0.6); onItemLanded(p); }
      }
    }
    const bob = p.landed ? Math.sin(p.t * 2.2) * 0.25 + 0.3 + (ITEMS[p.id].float || 0) : 0;
    p.mesh.position.set(p.x, p.y + itemHalfH(p.id) + bob, p.z);
    p.mesh.rotation.y += dt * 0.8;
  }
}
function nearestPickup(x, y, z, r) {
  let best = null, bd = r;
  for (const p of PICKUPS) {
    if (!p.landed) continue;
    const d = Math.hypot(p.x - x, (p.y - y) * 0.6, p.z - z);
    if (d < bd && p.y - y < 7 && p.y - y > -6) { bd = d; best = p; }
  }
  return best;
}
