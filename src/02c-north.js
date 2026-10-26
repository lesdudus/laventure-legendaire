// ------------------------------ MOBILIER : CHAMBRE, SALLE DE BAIN, BUREAU ------------------------------
function buildNorthRooms() {
  const WD = 0x5e3b22, WL = 0xc89a64, WH = 0xf2f0ea;
  // ===== CHAMBRE =====
  legs4(140, 30, 300, 230, 15, 6, 'wood', WD);
  box(140, 15, 30, 300, 30, 230, 'wood', 0x8a5a36, { tag: 'bed' });
  box(142, 30, 32, 298, 52, 228, 'fabric', WH, { tag: 'bed' });
  box(140, 52, 78, 300, 57, 232, 'fabric', 0x4a6fa5, { tag: 'bed' });
  box(150, 52, 38, 215, 60, 70, 'fabric', 0xf7f7f7); box(225, 52, 38, 290, 60, 70, 'fabric', 0xf7f7f7);
  box(138, 0, 22, 302, 100, 30, 'wood', WD);
  shadow(140, 30, 300, 230);
  box(95, 0, 28, 135, 55, 68, 'wood', WL); deco(97, 30, 67.5, 133, 32, 68.5, 'wood', WD);
  box(105, 55, 40, 111, 63, 46, 'plain', 0xfff3d6); glow(107.5, 63, 42.5, 108.5, 65.5, 43.5, 0xffb347);
  box(305, 0, 28, 345, 55, 68, 'wood', WL); deco(307, 30, 67.5, 343, 32, 68.5, 'wood', WD);
  box(318, 55, 40, 332, 58, 54, 'metal', 0x444444); box(323, 58, 45, 327, 78, 49, 'metal', 0x444444);
  bookPile(100, 118, 130, 146, 14, 11); bookPile(100, 94, 130, 118, 28, 12); bookPile(100, 70, 130, 94, 42, 13);
  // lit de Léa
  legs4(20, 232, 110, 398, 12, 5, 'wood', 0xe8d5b5);
  box(20, 12, 232, 110, 24, 398, 'wood', 0xe8d5b5, { tag: 'bed' });
  box(22, 24, 234, 108, 40, 396, 'fabric', 0xf2a7c3, { tag: 'bed' });
  box(30, 40, 238, 100, 46, 262, 'fabric', 0xffffff);
  // doudou sur l'oreiller (marche vers la tête de lit puis la fenêtre) et marchepied pour monter sur le lit
  box(40, 46, 240, 62, 58, 256, 'fabric', 0xc9a27e); box(44, 58, 243, 58, 62, 253, 'fabric', 0xd7b48f);
  box(110, 0, 300, 124, 28, 322, 'wood', 0xf2c94c); box(124, 0, 300, 138, 14, 322, 'wood', 0xf2c94c);
  box(12, 0, 228, 112, 70, 234, 'wood', 0xe8d5b5);
  shadow(20, 232, 110, 398);
  // armoire sur pieds (60 cm de profondeur : passage de 50 cm le long du lit des parents)
  legs4(350, 250, 410, 410, 9, 5, 'wood', WD);
  box(350, 9, 250, 410, 215, 410, 'wood', WL);
  deco(349, 20, 329, 350.5, 200, 331, 'wood', WD); deco(349, 105, 300, 350.5, 125, 304, 'metal', 0xd4af37); deco(349, 105, 356, 350.5, 125, 360, 'metal', 0xd4af37);
  shadow(350, 250, 410, 410);
  // pile de cartons contre l'armoire : marchepied de Moustache (sol → 46 → 84 → 110 → armoire 215)
  box(345, 0, 196, 407, 46, 246, 'paper', 0xb98b5a); box(350, 46, 200, 402, 84, 242, 'paper', 0xc49a6c); box(356, 84, 205, 398, 110, 240, 'paper', 0xa97c4f);
  for (const [y0, y1, z0, z1] of [[0, 46, 195.6, 196], [46, 84, 199.6, 200], [84, 110, 204.6, 205]]) deco(372, y0, z0, 380, y1, z1, 'paper', 0xe8d4a8);
  deco(374, 110, 205, 380, 110.3, 240, 'paper', 0xe8d4a8); deco(360, 60, 199.6, 380, 70, 200, 'paper', 0xf5f0e6);
  shadow(345, 196, 407, 246);
  // coffre à jouets (décalé vers l'ouest pour laisser passer les humains entre lui et le château), tapis, chaussons
  box(115, 0, 335, 190, 38, 405, 'wood', 0xd9534f); deco(114.5, 15, 334.5, 190.5, 22, 405.5, 'wood', 0xf2c94c);
  box(120, 0, 245, 320, 0.8, 330, 'carpet', 0xe6c3c3);
  box(160, 0, 238, 168, 3, 262, 'fabric', 0x7e57c2); box(172, 0, 238, 180, 3, 262, 'fabric', 0x7e57c2);

  // ===== SALLE DE BAIN =====
  box(430, 0, 4, 710, 40, 80, 'plain', WH);
  box(430, 40, 4, 710, 55, 10, 'plain', WH); box(430, 40, 74, 710, 55, 80, 'plain', WH);
  box(430, 40, 10, 436, 55, 74, 'plain', WH); box(704, 40, 10, 710, 55, 74, 'plain', WH);
  waterQuad(436, 10, 704, 74, 50);
  box(690, 55, 4, 700, 65, 14, 'metal', 0xb8bcc2);
  box(470, 0, 88, 630, 0.8, 136, 'carpet', 0x9ecae1);
  legs4(650, 150, 710, 260, 12, 4, 'metal', 0xb8bcc2);
  box(650, 12, 150, 710, 85, 260, 'plain', WH); deco(649, 20, 204, 650, 78, 206, 'plain', 0xcccccc);
  box(646, 85, 146, 712, 88, 264, 'stone', 0xeeeeee); deco(665, 88, 175, 700, 88.6, 235, 'metal', 0xc9d6df);
  deco(708, 110, 160, 712, 180, 250, 'plain', 0xcfe8f3);
  box(676, 0, 200, 684, 12, 208, 'metal', 0x9aa3a8);
  waterQuad(666, 190, 690, 214, 0.45);
  shadow(650, 150, 710, 260);
  box(432, 0, 330, 474, 40, 390, 'plain', WH); box(430, 40, 325, 446, 80, 395, 'plain', WH); deco(436, 40, 334, 474, 43, 386, 'plain', 0xf7f7f7);
  box(600, 0, 355, 650, 55, 405, 'fabric', 0xc8a97e);
  box(500, 0, 250, 545, 4, 290, 'fabric', 0xf4a259);
  // ===== BUREAU =====
  box(820, 72, 30, 980, 75, 100, 'wood', WL);
  legs4(820, 30, 980, 100, 72, 4, 'wood', WD);
  box(824, 22, 30, 976, 72, 32, 'wood', WL, { tag: 'panel' });
  box(934, 0, 36, 974, 70, 96, 'wood', WL); deco(933.5, 35, 50, 934, 37, 80, 'metal', 0x888888); deco(933.5, 12, 50, 934, 14, 80, 'metal', 0x888888);
  shadow(820, 30, 980, 100);
  box(885, 75, 40, 915, 77, 55, 'metal', 0x333333); box(897, 77, 44, 903, 90, 50, 'metal', 0x333333);
  box(860, 88, 42, 940, 130, 46, 'plain', 0x222428); deco(863, 91, 46, 937, 127, 46.3, 'plain', 0x2a3b55);
  box(870, 75, 62, 930, 77, 76, 'plain', 0x3a3a3a); box(940, 75, 70, 946, 77, 80, 'plain', 0x3a3a3a);
  box(950, 75, 50, 958, 85, 58, 'plain', 0xc0392b);
  box(828, 75, 70, 852, 76, 92, 'plain', WH); box(834, 76, 75, 846, 80, 86, 'plain', 0xd9a35b);
  box(960, 75, 36, 972, 77, 48, 'metal', 0x2d2d2d); box(964, 77, 40, 968, 104, 44, 'metal', 0x2d2d2d);
  // règle posée contre le bureau (rampe)
  RAMPS.push({ axis: 'z', a0: 100, a1: 192, h0: 75, h1: 0, w0: 838, w1: 846, kind: 'ruler' });
  // chaise de bureau
  box(880, 44, 115, 930, 50, 165, 'fabric', 0x2f2f33); box(880, 50, 165, 930, 95, 170, 'fabric', 0x2f2f33);
  box(902, 8, 137, 908, 44, 143, 'metal', 0x777777);
  box(878, 3, 137, 932, 8, 143, 'metal', 0x555555); box(902, 3, 113, 908, 8, 167, 'metal', 0x555555);
  for (const [x, z] of [[878, 137], [928, 137], [902, 113], [902, 163]]) box(x, 0, z, x + 4, 3, z + 6, 'plain', 0x222222);
  shadow(880, 115, 930, 165);
  // ANTICHAMBRE DE LA BASE (derrière le bureau) : le lit, le coffre et l'établi sont dans le trou de souris (02g-base.js)
  deco(872, 0, 8, 873, 14, 9, 'wood', 0xe8d5b5); deco(873, 9, 8.2, 879, 13, 8.8, 'paper', 0xb11f4b);
  glow(900, 6, 2, 902, 8, 4, 0xfff2a8);
  box(815, 0, 2, 820, 20, 22, 'paper', 0xa47c52);
  box(822, 0, 1, 978, 0.4, 29, 'carpet', 0x8d6e63);
  W.zones.base = { x0: 822, x1: 978, z0: 1, z1: 29, y0: -1, y1: 30 };
  // étagère
  box(1158, 0, 120, 1198, 200, 123, 'wood', WD); box(1158, 0, 297, 1198, 200, 300, 'wood', WD); box(1196, 0, 123, 1198, 200, 297, 'wood', WD);
  for (const y of [0, 48, 96, 144, 197]) box(1158, y, 123, 1196, y + 3, 297, 'wood', WD);
  for (const [y, s] of [[3, 21], [51, 22], [99, 23], [147, 24]]) bookRow(1162, 1195, y, 125, 295, s);
  // boîtes d'archives empilées devant l'étagère : marchepied de Moustache (sol → 32 → 64 → 96 → étagère 200)
  box(1110, 0, 158, 1152, 32, 208, 'paper', 0xe8e2d0); box(1112, 32, 160, 1150, 64, 206, 'paper', 0xdcd5c0); box(1114, 64, 162, 1148, 96, 204, 'paper', 0xe8e2d0);
  for (const y of [12, 44, 76]) deco(1109.6, y, 176, 1110, y + 8, 190, 'paper', 0x2f5d8a);
  shadow(1110, 158, 1152, 208);
  // classeur + imprimante, corbeille, plante, tapis
  box(740, 0, 330, 800, 70, 400, 'metal', 0x8e959b); deco(739.5, 30, 345, 740, 34, 385, 'metal', 0x555555);
  box(745, 70, 335, 795, 90, 395, 'plain', 0x3b3f44); deco(750, 90, 345, 790, 91, 385, 'paper', 0xffffff);
  box(1000, 0, 120, 1030, 30, 150, 'metal', 0x2d2d2d);
  box(1150, 0, 20, 1185, 35, 55, 'dirt', 0xb5653a);
  for (const [x, z, h] of [[1160, 30, 70], [1170, 40, 85], [1158, 45, 60], [1175, 25, 75]]) deco(x - 6, 30, z - 6, x + 6, h, z + 6, 'leaf', 0x3f8f3f);
  box(830, 0, 200, 1010, 0.8, 330, 'carpet', 0x7f8fa6);
}
