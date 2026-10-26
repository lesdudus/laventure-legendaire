# L'Aventure Légendaire

Jeu de survie 3D dans le navigateur (Three.js) : tu mesures 5 cm dans une maison à taille réelle.

## Jouer

Ouvre `laventure-legendaire.html` dans Edge (double-clic). Une connexion Internet est nécessaire au premier lancement (Three.js est chargé depuis un CDN).

Deux styles graphiques au choix dans **Échap → Paramètres → Style graphique** : « Minecraft (pixel) » (par défaut) ou « Low-poly chaleureux ». Le choix est mémorisé.

### Survie en bref

- **🍽️ Nourriture** : une seule barre pour manger et boire, qui se vide en 2 jours de jeu (≈ 40 min réelles). Objets ramassés : +5 à 10 %. Recettes : +25 à 60 %. Sous 15 %, l'écran devient bleu (entièrement à 0 %).
- **📖 Bibliothèque de recettes** : bouton dans l'inventaire (`I`). Les ingrédients jamais possédés apparaissent en gris. Paramètre pour cacher les recettes non découvertes.
- **🔥 Barbecue** (terrasse du jardin) : chaud un jour sur deux de 12 h à 22 h. Grimpe par le sac de charbon et les bûches, fais griller le chamallow géant → Festin (Nourriture bloquée à 100 % pendant 1 jour).
- **🚗 Voiture de poche** : `E` près de la voiture pour la ranger, clic droit sur 🚗 pour la ressortir. Elle n'a plus de coffre.
- **🫥 Tenue d'invisibilité** : clic droit pour l'activer. 1 Cristal d'ombre 🔮 = 4 h de jeu. Un cristal apparaît chaque matin dans la maison : il flotte au ras du sol, entouré d'un petit halo violet qui pulse (4 au maximum). Les humains et Rex ne te voient ni ne te sentent, mais ils t'entendent.
- **Le temps continue** dans l'inventaire, le coffre, l'atelier, le journal… Seul `Échap` met le jeu en pause.
- **💨 Souffle** : en courant (`Maj`), la barre au-dessus de l'inventaire se vide en 20 s. À 0, tu dois marcher ; tu peux recourir dès 30 %. Elle se remplit en 8 s, 1 s après l'arrêt de la course. Courir ne fatigue plus la barre d'énergie ⚡.
- **🐱 Chevaucher Moustache** : dès 20 d'affection, `F` près de lui. Pas par défaut, galop avec `Maj`, bond de 1,30 m avec `Espace`. Sur son dos, les humains et Rex ne te voient ni ne te sentent. Moustache se fatigue au bout de 90 s (jauge 🐱), sauf avec le paramètre « Chevauchée illimitée ». Des marchepieds mènent partout en quelques bonds : pile de cartons (armoire de la chambre), boîtes d'archives (étagère du bureau), panier en osier (bibliothèque du salon), récupérateur d'eau (toit de la cabane). Le seuil d'affection est réglé dans `CONFIG.cat.rideAff` : un futur mode difficile pourra l'augmenter (60 ou 80, par exemple).
- **Paramètres de confort** : « Rex dort la nuit (20 h – 8 h) », « Chevauchée de Moustache illimitée », aperçus de construction, style graphique.

### Fluidité

- **Qualité graphique** (Paramètres) : « Automatique » (par défaut) baisse un peu la résolution interne quand des images arrivent en retard, puis la remonte quand tout redevient fluide. « Haute » la garde au maximum, « Économie » la fixe au plus bas.
- **Afficher les images par seconde** (Paramètres) : petit compteur au-dessus de la barre rapide.
- L'écran titre et les menus de pause se redessinent 15 fois par seconde. Quand la fenêtre n'est pas active, le jeu se met en pause et se redessine 5 fois par seconde.
- Conseil : n'ouvre le jeu qu'à un seul endroit. Chaque copie ouverte utilise la carte graphique.

## Organisation

| Dossier / fichier | Rôle |
|---|---|
| `src/` | Sources du jeu : `00-shell.html` (page, styles, interface) + modules JS numérotés dans l'ordre d'assemblage (`02h-castle.js` : château Lego de Léa, `02i-bbq.js` : barbecue, `09g-style.js` : styles graphiques, `09h-features.js` : voiture de poche, invisibilité, repères d'équipement) |
| `tools/build.py` | Assemble `src/` en un seul fichier jouable |
| `tools/check_enc.py` | Vérifie qu'aucun texte n'est mal encodé (accents) |
| `tools/style-preview.js` | Prototype d'aperçu des styles graphiques |
| `docs/` | Planche des styles graphiques et captures (local, non publié sur GitHub) |
| `laventure-legendaire.html` | Jeu généré (ne pas modifier à la main) |

## Reconstruire et vérifier

```powershell
python tools/build.py
node --check tools/check.mjs
npx --yes eslint@8 --no-eslintrc --env browser,es2022 --parser-options=ecmaVersion:2022 --parser-options=sourceType:module --rule '{"no-undef":"error","no-redeclare":"error"}' tools/check.mjs
python tools/check_enc.py
```

Les fichiers sources sont en UTF-8 : évite `Get-Content`/`Set-Content` de PowerShell pour les modifier (ils abîment les accents).
