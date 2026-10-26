// ------------------------------ MOBILIER : SALON, CUISINE ------------------------------
function buildSouthRooms() {
  const WD = 0x5e3b22, WL = 0xc89a64, WH = 0xf2f0ea;
  // ===== SALON =====
  box(150, 0, 520, 420, 0.8, 740, 'carpet', 0xa23b3b); deco(165, 0.8, 535, 405, 0.9, 725, 'carpet', 0xc9a26b); deco(180, 0.9, 550, 390, 1.0, 710, 'carpet', 0x8e2f2f);
  // canapé (face au nord, contre la fenêtre) : assise 42, accoudoirs 58, dossier 74
  legs4(152, 762, 368, 838, 12, 6, 'wood', WD);
  box(150, 12, 760, 370, 42, 840, 'fabric', 0x6b7f5e, { tag: 'sofa' });
  box(150, 42, 818, 370, 74, 840, 'fabric', 0x5f7353, { tag: 'sofa' });
  box(150, 42, 760, 170, 58, 818, 'fabric', 0x5f7353, { tag: 'sofa' }); box(350, 42, 760, 370, 58, 818, 'fabric', 0x5f7353, { tag: 'sofa' });
  box(175, 42, 790, 215, 56, 816, 'fabric', 0xe9c46a); box(305, 42, 790, 345, 56, 816, 'fabric', 0xe76f51);
  shadow(150, 760, 370, 840);
  box(180, 0, 728, 202, 12, 750, 'fabric', 0xf2c94c);
  box(206, 0, 724, 236, 28, 756, 'fabric', 0x8d6e63);
  // table basse + piste orange + tremplin
  table(200, 600, 320, 680, 43, 'wood', WL);
  box(290, 43, 610, 305, 45, 616, 'plain', 0x222222);
  RAMPS.push({ axis: 'x', a0: 60, a1: 200, h0: 0, h1: 43, w0: 632, w1: 644, kind: 'track' });
  RAMPS.push({ axis: 'x', a0: 430, a1: 462, h0: 0, h1: 7, w0: 600, w1: 612, kind: 'track' });
  // propulseur A (facile) : lance la voiture vers le toit de l'aquarium
  RAMPS.push({ axis: 'x', a0: 170, a1: 140, h0: 0, h1: 10, w0: 700, w1: 712, kind: 'launch', vy: 450, v: 150 });
  // piste cachée vers le plan de travail + propulseur B (difficile) vers le dessus du frigo
  RAMPS.push({ axis: 'x', a0: 984, a1: 1134, h0: 0, h1: 90, w0: 800, w1: 812, kind: 'track' });
  RAMPS.push({ axis: 'z', a0: 660, a1: 630, h0: 90, h1: 100, w0: 1137, w1: 1151, kind: 'launch', vy: 420, v: 260 });
  // vase sur le meuble TV (peut tomber lors d'un accident)
  {
    const m = meshBoxes([[376, 48, 456, 386, 50, 466, 0x2f7dc1], [375, 50, 455, 387, 62, 467, 0x3d8fd6], [377, 62, 457, 385, 66, 465, 0x2f7dc1],
      [379, 66, 459, 380, 78, 460, 0x388e3c], [382, 66, 461, 383, 76, 462, 0x388e3c], [377, 76, 457, 382, 81, 462, 0xe91e63], [380, 74, 459, 385, 78, 464, 0xffeb3b]], 'plain');
    W.scene.add(m); W.vase = m;
  }
  // drapeau à damier (départ du Grand Prix)
  deco(439, 0, 559, 441, 30, 561, 'plain', 0xffffff);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) deco(441 + i * 3.5, 22 + j * 4, 559.6, 444.5 + i * 3.5, 26 + j * 4, 560.4, 'plain', (i + j) % 2 ? 0x111111 : 0xffffff);
  // meuble TV (dégagement 10 cm) + écran, décalés à l'est pour dégager la porte de la chambre (x 150..240)
  legs4(232, 432, 388, 470, 10, 4, 'wood', WD);
  box(230, 10, 430, 390, 48, 470, 'wood', WD, { tag: 'tvstand' });
  shadow(230, 430, 390, 470);
  box(300, 48, 440, 320, 52, 452, 'metal', 0x222222);
  box(240, 52, 444, 380, 130, 450, 'plain', 0x1d1d1f);
  {
    const b = newBucket(); geoBox(b, 243, 55, 450, 377, 127, 450.4, 0xffffff, 1, false);
    W.tv = { mat: new THREE.MeshBasicMaterial({ color: 0x0b0b0e }), on: false, t: 0 };
    W.scene.add(new THREE.Mesh(geoFromBucket(b), W.tv.mat));
  }
  // bibliothèque (le bocal y est posé en cas de capture)
  box(4, 0, 440, 44, 190, 443, 'wood', WL); box(4, 0, 537, 44, 190, 540, 'wood', WL); box(2, 0, 443, 4, 190, 537, 'wood', WL);
  for (const y of [0, 46, 92, 138, 187]) box(4, y, 443, 44, y + 3, 537, 'wood', WL);
  for (const [y, s] of [[3, 31], [49, 32], [95, 33], [141, 34]]) bookRow(6, 40, y, 445, 535, s);
  W.spots.jar = { x: 24, y: 190, z: 490 };
  // panier en osier avec un plaid devant la bibliothèque : marchepied de Moustache (sol → 70 → bibliothèque 190)
  box(50, 0, 472, 88, 66, 510, 'wood', 0xc8a165);
  for (const y of [14, 30, 46]) deco(49.6, y, 471.6, 88.4, y + 2, 510.4, 'wood', 0x9c7a45);
  box(49, 66, 471, 89, 70, 511, 'fabric', 0xb5523b); deco(48.6, 54, 480, 49, 70, 500, 'fabric', 0xb5523b);
  shadow(50, 472, 88, 510);
  // aquarium sur son meuble
  box(4, 0, 680, 60, 55, 790, 'wood', WD);
  box(8, 55, 690, 56, 58, 780, 'stone', 0xc2b280);
  geoBox(bucket('glassB'), 8, 55, 690, 56, 95, 780, 0xffffff, 1, false); addSolid(8, 55, 690, 56, 95, 780, 'glass');
  geoBox(bucket('waterB'), 10, 58, 692, 54, 90, 778, 0xffffff, 1, false);
  box(0, 95, 688, 58, 97, 782, 'plain', 0x222222);
  deco(15, 58, 760, 27, 72, 772, 'stone', 0x8a8a8a); deco(18, 72, 763, 24, 78, 769, 'stone', 0x8a8a8a);
  for (const [x, z, h] of [[40, 705, 25], [46, 715, 18], [20, 712, 22]]) deco(x - 1.5, 58, z - 1.5, x + 1.5, 58 + h, z + 1.5, 'leaf', 0x2e8b57);
  W.fishBounds = { x0: 14, x1: 50, y0: 62, y1: 86, z0: 698, z1: 772 };
  // fauteuil, lampadaire, plante, coin du chat
  legs4(470, 690, 550, 780, 10, 5, 'wood', WD);
  box(470, 10, 690, 550, 40, 780, 'fabric', 0xd4a017); box(470, 40, 764, 550, 80, 780, 'fabric', 0xc49000);
  box(470, 40, 690, 484, 55, 764, 'fabric', 0xc49000); box(536, 40, 690, 550, 55, 764, 'fabric', 0xc49000);
  shadow(470, 690, 550, 780);
  box(600, 0, 800, 620, 3, 820, 'metal', 0x333333); box(608, 3, 808, 612, 140, 812, 'metal', 0x333333);
  // plante (à gauche de la porte de la salle de bain : passage de 50 cm pour Rex devant le panier du chat)
  box(470, 0, 440, 510, 40, 480, 'dirt', 0xb5653a);
  for (const [x, z, h] of [[480, 450, 95], [495, 465, 110], [500, 448, 80], [482, 470, 90]]) deco(x - 7, 40, z - 7, x + 7, h, z + 7, 'leaf', 0x2f7d32);
  box(560, 0, 470, 620, 3, 530, 'fabric', 0x7e57c2, { tag: 'catbed' });
  box(560, 3, 470, 620, 9, 476, 'fabric', 0x6a45b0, { tag: 'catbed' }); box(560, 3, 524, 620, 9, 530, 'fabric', 0x6a45b0, { tag: 'catbed' });
  box(560, 3, 476, 566, 9, 524, 'fabric', 0x6a45b0, { tag: 'catbed' }); box(614, 3, 476, 620, 9, 524, 'fabric', 0x6a45b0, { tag: 'catbed' });
  box(590, 0, 545, 620, 4, 565, 'metal', 0x3d7ab8, { tag: 'bowl' });
  W.catSpots = [
    { x: 590, z: 500, y: 3, nap: true }, { x: 260, z: 790, y: 42, ax: 260, az: 745, nap: true },
    { x: 410, z: 851, y: 90, ax: 410, az: 800, nap: true }, { x: 220, z: 150, y: 57, ax: 220, az: 250, nap: true },
    { x: 605, z: 580, y: 0.3 }, { x: 300, z: 560, y: 1 }, { x: 900, z: 520, y: 0.3 }, { x: 330, z: 1000, y: 0, garden: true }, { x: 800, z: 1150, y: 0, garden: true },
  ];

  // ===== CUISINE =====
  box(1125, 0, 428, 1198, 180, 498, 'metal', 0xf4f6f7, { tag: 'fridge' });
  deco(1124, 60, 440, 1125, 120, 444, 'metal', 0x9e9e9e); deco(1124.2, 128, 430, 1125, 129, 496, 'metal', 0xcccccc);
  box(1138, 0, 500, 1198, 86, 848, 'plain', WH); deco(1137, 0, 500, 1138, 8, 848, 'plain', 0x8d8d8d);
  for (let z = 520; z < 840; z += 80) deco(1137.2, 40, z, 1138, 44, z + 6, 'metal', 0x9e9e9e);
  box(1134, 86, 500, 1198, 90, 848, 'stone', 0x4a4a4a);
  deco(1145, 90, 680, 1190, 90.6, 740, 'metal', 0xb8bcc2); deco(1185, 90, 705, 1190, 108, 712, 'metal', 0xb8bcc2);
  deco(1145, 90, 560, 1190, 90.6, 620, 'plain', 0x111111);
  for (const [x, z] of [[1155, 570], [1172, 570], [1155, 595], [1172, 595]]) deco(x, 90.6, z, x + 12, 91, z + 12, 'metal', 0x555555);
  box(1150, 90, 780, 1160, 102, 790, 'plain', 0xe0a030); box(1165, 90, 640, 1173, 100, 648, 'plain', 0xf39c12);
  box(1165, 150, 660, 1198, 220, 846, 'plain', WH);
  table(800, 600, 940, 700, 75, 'wood', 0xb07a4a);
  chair(845, 555, 885, 595, 45, 'n', WL); chair(845, 705, 885, 745, 45, 's', WL);
  chair(755, 630, 795, 670, 45, 'w', WL); chair(945, 630, 985, 670, 45, 'e', WL);
  box(847, 45, 707, 883, 52, 743, 'fabric', 0xc0392b);
  box(852, 52, 706, 876, 68, 720, 'paper', 0xf2c94c); deco(853, 58, 705.8, 860, 64, 706, 'paper', 0xd35400);
  bookPile(822, 712, 842, 738, 42, 41); bookPile(800, 712, 820, 738, 28, 42); bookPile(778, 712, 798, 738, 14, 43);
  box(680, 0, 760, 760, 5, 840, 'fabric', 0x8b5a2b, { tag: 'dogbed' });
  box(680, 5, 760, 760, 14, 768, 'fabric', 0x6d4421, { tag: 'dogbed' }); box(680, 5, 832, 760, 14, 840, 'fabric', 0x6d4421, { tag: 'dogbed' });
  box(680, 5, 768, 688, 14, 832, 'fabric', 0x6d4421, { tag: 'dogbed' }); box(752, 5, 768, 760, 14, 832, 'fabric', 0x6d4421, { tag: 'dogbed' });
  box(772, 0, 812, 800, 6, 840, 'metal', 0xb03a2e, { tag: 'bowl' }); waterQuad(775, 815, 797, 837, 6.1);
  box(806, 0, 812, 834, 6, 840, 'metal', 0xb03a2e, { tag: 'bowl' }); deco(809, 6, 815, 831, 6.6, 837, 'dirt', 0x7a4a24);
  box(1040, 0, 432, 1075, 62, 470, 'metal', 0x9aa3a8); deco(1038, 62, 430, 1077, 65, 472, 'metal', 0x6d757a);
}
