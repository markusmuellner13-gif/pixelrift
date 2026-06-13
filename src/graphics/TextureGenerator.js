import { COLORS, TILE } from '../config.js';

// Palette: index → hex color (0 = transparent)
const P = {
  _: 0,          // transparent
  S: COLORS.skin,
  H: COLORS.hair,
  G: COLORS.hatGreen,
  W: COLORS.shirtWhite,
  B: COLORS.pantsBlue,
  E: COLORS.shoeBrown,
  D: 0x222222,   // dark eye
  N: 0xff5533,   // nose
  R: 0xcc3322,   // hat shadow
  L: 0x44aa22,   // hat light
  Y: COLORS.coin,
  Z: COLORS.coinDark,
  K: COLORS.goomba,
  J: COLORS.goombaDark,
  T: COLORS.koopa,
  U: COLORS.koopaDark,
  C: COLORS.koopaSkin,
  F: COLORS.cloud,
  M: COLORS.mushroomTop,
  X: COLORS.mushroom,
  O: COLORS.fireflower,
  A: COLORS.star,
  Q: 0xffffff,
  V: COLORS.flagGreen,
  I: 0x888888,   // grey
  p: COLORS.pipe,
  q: COLORS.pipeDark,
  r: COLORS.ground,
  s: COLORS.groundTop,
  b: COLORS.brick,
  c: COLORS.brickDark,
};

// Pixel art sprites: 2D array of palette keys
const SPRITES = {
  nova_small_idle: [
    '____GGGGG___',
    '___GGGGGGG__',
    '___GGRRRRG__',
    '___SSSSSSS__',
    '__SSSDSSSS__',
    '__SSSSSSSSS_',
    '__WWWWWWWWW_',
    '_WWWWWWWWWW_',
    '__BBBBBBBBB_',
    '__BBBBBBBBB_',
    '__BBBBBBBB__',
    '__EEBBB_EEB_',
    '__EEEEE_EEEE',
  ],
  nova_small_walk0: [
    '____GGGGG___',
    '___GGGGGGG__',
    '___GGRRRRG__',
    '___SSSSSSS__',
    '__SSSDSSSS__',
    '__SSSSSSSSS_',
    '__WWWWWWWWW_',
    '_WWWWWWWWWW_',
    '__BBBBBBBBB_',
    '__BBBBBBBBB_',
    '_BBBB__BBBB_',
    '_EEE___EEEE_',
    'EEE_____EEE_',
  ],
  nova_small_walk1: [
    '____GGGGG___',
    '___GGGGGGG__',
    '___GGRRRRG__',
    '___SSSSSSS__',
    '__SSSDSSSS__',
    '__SSSSSSSSS_',
    '_WWWWWWWWWW_',
    '__WWWWWWWWW_',
    '__BBBBBBBBB_',
    '__BBBBBBBBB_',
    '__BBBBBBBBB_',
    '__BBBB___EEE',
    '__EEE_____EE',
  ],
  nova_small_jump: [
    '___GGGGG____',
    '__GGGGGGG___',
    '__GGRRRRG___',
    '__SSSSSSS___',
    '_SSSDSSSSS__',
    '_SSSSSSSSSS_',
    '_WWWWWWWWWW_',
    'WWWWWWWWWWWW',
    '__BBBBBBBBB_',
    '_BBBB__BBBB_',
    'EEE______EEE',
    'EE________EE',
    '____________',
  ],
  nova_big_idle: [
    '____GGGGG___',
    '___GGGGGGG__',
    '__GGGRRRRGG_',
    '__SSSSSSSSS_',
    '_SSSDDSSSSS_',
    '_SSSSSSSSSSS',
    '_WWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    '_BBBBBBBBBBB',
    '_BBBBBBBBBBB',
    '_BBBBBBBBBBB',
    '_BBBBBBBBBB_',
    '_EEBBBB_BEEE',
    '_EEEEE__EEEE',
    '____________',
  ],
  nova_big_jump: [
    '____GGGGG___',
    '___GGGGGGG__',
    '__GGGRRRRGG_',
    '__SSSSSSSSS_',
    '_SSSDDSSSSS_',
    '_SSSSSSSSSSS',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    '_WWWWWWWWWWW',
    '_BBBBBBBBBBB',
    '_BBBB___BBBB',
    'EEE_______EEE',
    'EE_________EE',
    '____________',
    '____________',
    '____________',
  ],
  nova_fire_idle: [
    '____GGGGG___',
    '___GGGGGGG__',
    '__GGGRRRRGG_',
    '__SSSSSSSSS_',
    '_SSSDDSSSSS_',
    '_SSSSSSSSSSS',
    '_OOOOOOOOOOO',
    'OOOOOOOOOOOO',
    'OOOOOOOOOOOO',
    '_BBBBBBBBBBB',
    '_BBBBBBBBBBB',
    '_BBBBBBBBBBB',
    '_BBBBBBBBBB_',
    '_EEBBBB_BEEE',
    '_EEEEE__EEEE',
    '____________',
  ],
  goomba_walk0: [
    '__JJJJJJJ___',
    '_JKKKKKKKJ__',
    'JKKKKKKKKKJ_',
    'JKKDDKKKDDKJ',
    'JKKNKKNKKKKJ',
    'JKKKKKKKKKJJ',
    '_JJKKKKKKJ__',
    '__KKKKKKK___',
    '_JJJKKJJJ___',
    'JJJJ_JJJJJ__',
  ],
  goomba_walk1: [
    '__JJJJJJJ___',
    '_JKKKKKKKJ__',
    'JKKKKKKKKKJ_',
    'JKKDDKKKDDKJ',
    'JKKNKKNKKKKJ',
    'JKKKKKKKKKJJ',
    '_JJKKKKKKJ__',
    '__KKKKKKK___',
    '__JJJKKJJJJ_',
    '__JJJJJ_JJJJ',
  ],
  goomba_dead: [
    '____________',
    '__JJJJJJJ___',
    '_JKKKKKKKJ__',
    'JKKKKKKKKKJ_',
    'JKKDDKKKDDKJ',
    'JKKKKKKKKKJJ',
    '_JJJJJJJJJ__',
    '____________',
  ],
  koopa_walk0: [
    '____TTTT____',
    '___TTTTTT___',
    '__CCCCCCCC__',
    '_CCCDDCCCC__',
    '_CCCCCCCCCC_',
    '_TTTTTTTTTT_',
    '__TTTTTTTT__',
    '__TTTTTTTT__',
    '___TTTTTT___',
    '__CCUU_UCC__',
    '_CCCC___CCCC',
  ],
  koopa_walk1: [
    '____TTTT____',
    '___TTTTTT___',
    '__CCCCCCCC__',
    '_CCCDDCCCC__',
    '_CCCCCCCCCC_',
    '_TTTTTTTTTT_',
    '__TTTTTTTT__',
    '__TTTTTTTT__',
    '___TTTTTT___',
    '_CCUU_UCC___',
    'CCCC___CCCC_',
  ],
  koopa_shell: [
    '___TTTTTT___',
    '__TTTTTTTT__',
    '_TTTTTTTTTT_',
    'TTTTTTTTTTTT',
    'TTUUUUUUUUTT',
    'TTUUUUUUUUTT',
    'TTTTTTTTTTTT',
    '_TTTTTTTTTT_',
    '__TTTTTTTT__',
    '___TTTTTT___',
  ],
  spiny_walk0: [
    '__JNJNJNJ___',
    '_JKKKKKKKJ__',
    'JKKKKKKKKKJ_',
    'JKKDDKKKDDKJ',
    'JKKNKKNKKKKJ',
    'NJKKKKKKKKKN',
    '_NNJKKKJNN__',
    '___NNJNN____',
    '__CCJJJCC___',
    '_CCCC_CCCCC_',
  ],
  spiny_walk1: [
    '_JNJNJNJN___',
    '_JKKKKKKKJ__',
    'JKKKKKKKKKJ_',
    'JKKDDKKKDDKJ',
    'JKKNKKNKKKKJ',
    'NJKKKKKKKKKN',
    '__NNJKKKJNN_',
    '____NNJNN___',
    '___CCJJJCC__',
    '__CCCC_CCCCC',
  ],
  coin0: [
    '___YYYYYY___',
    '__YYYYZYYY__',
    '_YYYYZZYYYY_',
    '_YYYZZYYYYYY',
    '_YYYYYYYYYY_',
    '_YYYYYYYYYY_',
    '_YYYYYYYYY__',
    '__YYYYYYYY__',
    '___YYYYYY___',
  ],
  coin1: [
    '____YYYYY___',
    '___YYYZYY___',
    '___YYZYYYY__',
    '___YYZYYYYY_',
    '___YYYYYYY__',
    '___YYYYYYY__',
    '___YYYYYY___',
    '___YYYYYYY__',
    '____YYYYY___',
  ],
  coin2: [
    '_____YY_____',
    '____YZYY____',
    '____YZYYYY__',
    '____YZYYYY__',
    '____YYYYYY__',
    '____YYYYYY__',
    '____YYYY____',
    '____YYYYYYY_',
    '_____YYY____',
  ],
  mushroom: [
    '___XXXXXXX__',
    '__XXXXXXXXXX',
    '_XXMXXMXXXXX',
    'XXXXMMMMXXXX',
    'XXXXXXXXXXXX',
    '_XXXXXXXXXX_',
    '__XXXXXXXX__',
    '__SSSSSSSS__',
    '_SSSSSSSSSS_',
    '_SSSSSSSSSS_',
    '__SSSSSSS___',
  ],
  fireflower: [
    '__OOOOO_OOOO',
    '_OOOOOOOOOOO',
    '__OOOOOOOOO_',
    '____OOOOO___',
    '____WOOOW___',
    '___WOOOOOOW_',
    '___WWWWWWWW_',
    '____WWWWWW__',
    '___WWWWWWWW_',
    '____WWWWWW__',
  ],
  star: [
    '____AAAA____',
    '___AAAAAA___',
    'AAAAAAAAAAAA',
    '_AAAAAAAAAA_',
    '__AAAAAAAA__',
    '____AAAA____',
    '___AAAAAA___',
    '__AAAAAAAA__',
    '_AAAAAAAAAA_',
    '____AAAA____',
  ],
  fireball: [
    '_OO_',
    'OOOO',
    'OOOO',
    '_YY_',
  ],
  tile_ground_top: [
    'ssssssssssssssss',
    'ssssssssssssssss',
    'rrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrr',
    'rrrcrrrrrrrcrrrrr',
    'rrrrrrrrrrrrrrrrr',
    'rcrrrrrcrrrrrcrrr',
    'rrrrrrrrrrrrrrrrr',
    'rrrrcrrrrrcrrrrrc',
    'rrrrrrrrrrrrrrrr',
    'rcrrrrrcrrrrrcrrr',
    'rrrrrrrrrrrrrrrr',
    'rrrrcrrrrrcrrrrrc',
    'rrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrr',
  ],
  tile_ground: [
    'rrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrr',
    'rrrcrrrrrrrcrrrrr',
    'rrrrrrrrrrrrrrrr',
    'rcrrrrrcrrrrrcrrr',
    'rrrrrrrrrrrrrrrr',
    'rrrrcrrrrrcrrrrrc',
    'rrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrr',
    'rrrrcrrrrrcrrrrrc',
    'rrrrrrrrrrrrrrrr',
    'rcrrrrrcrrrrrcrrr',
    'rrrrrrrrrrrrrrrr',
    'rrrrcrrrrrcrrrrrc',
    'rrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrr',
  ],
  tile_brick: [
    'bbbbbbbbbbbbbbbb',
    'bcccccccbccccccc',
    'bcccccccbccccccc',
    'bcccccccbccccccc',
    'bbbbbbbbbbbbbbbb',
    'cccbbbbbbbbcbbbb',
    'cccbbbbbbbbcbbbb',
    'cccbbbbbbbbcbbbb',
    'bbbbbbbbbbbbbbbb',
    'bcccccccbccccccc',
    'bcccccccbccccccc',
    'bcccccccbccccccc',
    'bbbbbbbbbbbbbbbb',
    'cccbbbbbbbbcbbbb',
    'cccbbbbbbbbcbbbb',
    'cccbbbbbbbbcbbbb',
  ],
  tile_question0: [
    'YYYYYYYYYYYYYY__',
    'YYYYYYYYYYYYYYY_',
    'YY__YYYYY___YYYY',
    'YYYY___Y____YYYY',
    'YYYY__YY____YYYY',
    'YYYY__YY____YYYY',
    'YYYY____YYYYYY__',
    'YYYY___YYYYYYY__',
    'YYYY__YYYY______',
    'YYYY__YYYY______',
    'YYYY_______YYYYY',
    'YYYY__YYYYYYYY__',
    'YYYY__YYYYYYYY__',
    'YY__YYYYY___YYYY',
    'YYYYYYYYYYYYYYY_',
    'YYYYYYYYYYYYYY__',
  ],
  tile_question1: [
    'AAAAAAAAAAAAAAAA',
    'AAAAAAAAAAAAAAAA',
    'AA__AAAAA___AAAA',
    'AAAA___A____AAAA',
    'AAAA__AA____AAAA',
    'AAAA__AA____AAAA',
    'AAAA____AAAAAA__',
    'AAAA___AAAAAAA__',
    'AAAA__AAAA______',
    'AAAA__AAAA______',
    'AAAA_______AAAAA',
    'AAAA__AAAAAAAA__',
    'AAAA__AAAAAAAA__',
    'AA__AAAAA___AAAA',
    'AAAAAAAAAAAAAAAA',
    'AAAAAAAAAAAAAAAA',
  ],
  tile_used: [
    'IIIIIIIIIIIIIIII',
    'IIIIIIIIIIIIIIII',
    'II__IIIII___IIII',
    'II__IIIII___IIII',
    'IIIIIIIIIIIIIIII',
    'IIIIIIIIIIIIIIII',
    'IIIIIIIIIIIIIIII',
    'IIIIIIIIIIIIIIII',
    'IIIIIIIIIIIIIIII',
    'IIIIIIIIIIIIIIII',
    'IIIIIIIIIIIIIIII',
    'IIIIIIIIIIIIIIII',
    'IIIIIIIIIIIIIIII',
    'II__IIIII___IIII',
    'IIIIIIIIIIIIIIII',
    'IIIIIIIIIIIIIIII',
  ],
  tile_pipe_top_l: [
    'qppppppppppppppp',
    'qppppppppppppppp',
    'qppppppppppppppp',
    'qppppppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
  ],
  tile_pipe_top_r: [
    'pppppppppppppppq',
    'pppppppppppppppq',
    'pppppppppppppppq',
    'pppppppppppppppq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
  ],
  tile_pipe_l: [
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
    'qqqqpppppppppppp',
  ],
  tile_pipe_r: [
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
    'ppppppppppppqqqq',
  ],
};

function drawSprite(scene, key, rows, paletteOverride = null) {
  const cols = Math.max(...rows.map(r => r.length));
  const h = rows.length;
  const rt = scene.add.renderTexture(0, 0, cols, h);
  const g = scene.add.graphics();
  const pal = paletteOverride ? { ...P, ...paletteOverride } : P;

  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const ch = row[rx];
      if (ch === '_' || ch === ' ') continue;
      const color = pal[ch];
      if (color === undefined || color === 0) continue;
      g.fillStyle(color, 1);
      g.fillRect(rx, ry, 1, 1);
    }
  });

  rt.draw(g, 0, 0);
  rt.saveTexture(key);
  g.destroy();
  rt.destroy();
}

/** Generate palette-swapped player sprites for every purchasable skin.
 *  Texture keys: `${spriteKey}_${skinId}` (classic keeps the original keys). */
export function generatePlayerSkins(scene, skins) {
  const novaKeys = Object.keys(SPRITES).filter(k => k.startsWith('nova_'));
  for (const skin of skins) {
    if (!skin.colors) continue; // classic = original palette
    for (const key of novaKeys) {
      drawSprite(scene, `${key}_${skin.id}`, SPRITES[key], skin.colors);
    }
  }
}

export function generateAllTextures(scene) {
  // Sprite textures
  for (const [key, rows] of Object.entries(SPRITES)) {
    drawSprite(scene, key, rows);
  }

  // Particles / effects
  const g = scene.add.graphics();

  // Coin particle
  g.fillStyle(COLORS.coin);
  g.fillRect(0, 0, 4, 4);
  g.generateTexture('particle_coin', 4, 4);
  g.clear();

  // Dust particle
  g.fillStyle(0xdddddd);
  g.fillRect(0, 0, 3, 3);
  g.generateTexture('particle_dust', 3, 3);
  g.clear();

  // Star particle
  g.fillStyle(COLORS.star);
  g.fillRect(0, 0, 4, 4);
  g.generateTexture('particle_star', 4, 4);
  g.clear();

  // Flagpole
  g.fillStyle(0x888888);
  g.fillRect(0, 0, 2, 96);
  g.fillStyle(COLORS.flagGreen);
  g.fillRect(2, 4, 14, 10);
  g.generateTexture('flagpole', 16, 96);
  g.clear();

  // Checkpoint flag (small)
  g.fillStyle(0x888888);
  g.fillRect(1, 0, 2, 32);
  g.fillStyle(COLORS.checkpoint);
  g.fillRect(3, 2, 8, 6);
  g.generateTexture('checkpoint', 12, 32);
  g.clear();

  // Life heart
  g.fillStyle(0xff3333);
  g.fillRect(1, 2, 3, 3);
  g.fillRect(4, 1, 3, 4);
  g.fillRect(7, 2, 3, 3);
  g.fillRect(0, 4, 10, 3);
  g.fillRect(1, 7, 8, 2);
  g.fillRect(2, 9, 6, 2);
  g.fillRect(3, 11, 4, 1);
  g.generateTexture('ui_heart', 10, 12);
  g.clear();

  // UI coin (small)
  g.fillStyle(COLORS.coin);
  g.fillRect(1, 0, 4, 1);
  g.fillRect(0, 1, 6, 4);
  g.fillRect(1, 5, 4, 1);
  g.generateTexture('ui_coin', 6, 6);
  g.clear();

  // Background clouds (big)
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(8, 4, 16, 8);
  g.fillRect(4, 6, 32, 12);
  g.fillRect(0, 10, 40, 10);
  g.generateTexture('cloud_big', 40, 20);
  g.clear();

  g.fillStyle(0xffffff, 0.9);
  g.fillRect(4, 2, 10, 6);
  g.fillRect(0, 5, 24, 10);
  g.generateTexture('cloud_small', 24, 15);
  g.clear();

  // Mountain silhouette
  g.fillStyle(COLORS.bgMtn, 0.7);
  g.fillTriangle(0, 48, 24, 0, 48, 48);
  g.fillTriangle(20, 48, 40, 4, 60, 48);
  g.generateTexture('mountain', 60, 48);
  g.clear();

  // Hill
  g.fillStyle(0x4a8c20, 0.8);
  for (let x = 0; x < 48; x++) {
    const h2 = Math.round(24 - Math.sqrt(Math.max(0, 576 - (x - 24) ** 2)));
    g.fillRect(x, h2, 1, 48 - h2);
  }
  g.generateTexture('hill', 48, 48);
  g.clear();

  // Star twinkle for menu
  g.fillStyle(0xffffff);
  g.fillRect(1, 0, 1, 3);
  g.fillRect(0, 1, 3, 1);
  g.generateTexture('star_twinkle', 3, 3);
  g.clear();

  // Explosion frames
  for (let i = 0; i < 4; i++) {
    const r = 2 + i * 3;
    g.fillStyle(i < 2 ? 0xff8800 : 0xff4400, 1 - i * 0.2);
    g.fillCircle(10, 10, r);
    g.generateTexture(`explosion_${i}`, 20, 20);
    g.clear();
  }

  // Snow tile (for world 3)
  g.fillStyle(0xaaccff);
  g.fillRect(0, 0, 16, 4);
  g.fillStyle(0x5588cc);
  g.fillRect(0, 4, 16, 12);
  g.generateTexture('tile_snow_top', 16, 16);
  g.clear();

  g.fillStyle(0x5588cc);
  g.fillRect(0, 0, 16, 16);
  g.generateTexture('tile_snow', 16, 16);
  g.clear();

  // Desert sand tile
  g.fillStyle(0xddbb55);
  g.fillRect(0, 0, 16, 4);
  g.fillStyle(0xcc9933);
  g.fillRect(0, 4, 16, 12);
  g.generateTexture('tile_sand_top', 16, 16);
  g.clear();

  g.fillStyle(0xcc9933);
  g.fillRect(0, 0, 16, 16);
  g.generateTexture('tile_sand', 16, 16);
  g.clear();

  // Moving platform
  g.fillStyle(0x7b5caa);
  g.fillRect(0, 0, 48, 8);
  g.fillStyle(0x9b7ccc);
  g.fillRect(2, 2, 44, 4);
  g.generateTexture('moving_platform', 48, 8);
  g.clear();

  // Spike hazard
  g.fillStyle(0xcccccc);
  g.fillTriangle(0, 12, 6, 0, 12, 12);
  g.fillTriangle(8, 12, 14, 0, 20, 12);
  g.generateTexture('spike', 20, 12);
  g.clear();

  // PWA icon canvas (192x192) — saved to /public by node script separately
  // But we can generate a basic icon texture
  g.fillStyle(0x1a1a2e);
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(COLORS.coin);
  g.fillRect(10, 8, 12, 16);
  g.fillStyle(0x2d7a16);
  g.fillRect(12, 2, 8, 8);
  g.generateTexture('app_icon', 32, 32);
  g.clear();

  // ─── Lava tiles (3 animation frames) ─────────────────────────
  const lavaColors = [COLORS.lava0, COLORS.lava1, COLORS.lava2];
  lavaColors.forEach((col, fi) => {
    g.fillStyle(col);
    g.fillRect(0, 0, 16, 6);
    g.fillStyle(fi === 0 ? COLORS.lava1 : COLORS.lava0);
    g.fillRect(0, 6, 16, 10);
    // Bubble details
    g.fillStyle(fi === 2 ? COLORS.lava2 : COLORS.lava1);
    g.fillRect(3, fi % 2 === 0 ? 1 : 2, 3, 2);
    g.fillRect(10, fi % 2 === 0 ? 2 : 1, 3, 2);
    g.generateTexture(`tile_lava_${fi}`, 16, 16);
    g.clear();
  });

  // ─── Water tiles (2 animation frames) ────────────────────────
  [COLORS.water0, COLORS.water1].forEach((col, fi) => {
    g.fillStyle(col);
    g.fillRect(0, 0, 16, 16);
    g.fillStyle(fi === 0 ? COLORS.water1 : COLORS.water0);
    g.fillRect(fi === 0 ? 2 : 5, 3, 3, 2);
    g.fillRect(fi === 0 ? 10 : 7, 5, 3, 2);
    g.generateTexture(`tile_water_${fi}`, 16, 16);
    g.clear();
  });

  // ─── Void / Star-Dimension tiles (World 4) ───────────────────
  g.fillStyle(COLORS.void0);
  g.fillRect(0, 0, 16, 4);
  g.fillStyle(COLORS.void1);
  g.fillRect(0, 4, 16, 12);
  g.fillStyle(0x8844ff);
  g.fillRect(3, 1, 2, 2);
  g.fillRect(11, 2, 2, 2);
  g.generateTexture('tile_void_top', 16, 16);
  g.clear();

  g.fillStyle(COLORS.void1);
  g.fillRect(0, 0, 16, 16);
  g.fillStyle(0x6622cc);
  g.fillRect(2, 4, 2, 2);
  g.fillRect(9, 11, 2, 2);
  g.generateTexture('tile_void', 16, 16);
  g.clear();

  // ─── Dash trail particle ──────────────────────────────────────
  g.fillStyle(0x88ddff, 0.8);
  g.fillRect(0, 0, 6, 4);
  g.generateTexture('particle_dash', 6, 4);
  g.clear();

  // ─── Coin magnet power-up ────────────────────────────────────
  g.fillStyle(COLORS.magnet);
  g.fillRect(2, 0, 8, 10);
  g.fillRect(0, 0, 5, 5);
  g.fillRect(7, 0, 5, 5);
  g.fillStyle(0xcc88ff);
  g.fillRect(3, 1, 6, 4);
  g.generateTexture('magnet', 12, 12);
  g.clear();

  // ─── Magnet particle (attracted coin) ────────────────────────
  g.fillStyle(COLORS.magnet, 0.6);
  g.fillRect(0, 0, 3, 3);
  g.generateTexture('particle_magnet', 3, 3);
  g.clear();

  // ─── Boss textures ────────────────────────────────────────────

  // Goomboss (World 1) — giant goomba, 24×24
  g.fillStyle(COLORS.goombaDark);
  g.fillRect(0, 0, 24, 20);
  g.fillStyle(COLORS.goomba);
  g.fillRect(2, 2, 20, 18);
  // Eyes
  g.fillStyle(0x222222);
  g.fillRect(4, 5, 4, 4);
  g.fillRect(16, 5, 4, 4);
  g.fillStyle(0xffffff);
  g.fillRect(5, 6, 2, 2);
  g.fillRect(17, 6, 2, 2);
  // Eyebrows (angry)
  g.fillStyle(COLORS.goombaDark);
  g.fillRect(3, 4, 6, 2);
  g.fillRect(15, 4, 6, 2);
  // Feet
  g.fillStyle(COLORS.goombaDark);
  g.fillRect(0, 20, 10, 4);
  g.fillRect(14, 20, 10, 4);
  g.generateTexture('boss_goomboss', 24, 24);
  g.clear();

  // Sphinx (World 2) — flying boss, 28×20
  g.fillStyle(0xcc9933);
  g.fillRect(2, 6, 24, 14);
  g.fillStyle(0xddaa44);
  g.fillRect(4, 8, 20, 10);
  g.fillStyle(0x8b4513);
  g.fillRect(10, 0, 8, 8);
  // Wings
  g.fillStyle(0xeecc66);
  g.fillRect(0, 2, 6, 8);
  g.fillRect(22, 2, 6, 8);
  // Eyes
  g.fillStyle(0xff4400);
  g.fillRect(8, 10, 4, 3);
  g.fillRect(16, 10, 4, 3);
  g.generateTexture('boss_sphinx', 28, 20);
  g.clear();

  // Frost Giant (World 3) — large icy boss, 24×28
  g.fillStyle(0x4488cc);
  g.fillRect(2, 0, 20, 28);
  g.fillStyle(0x88bbff);
  g.fillRect(4, 2, 16, 22);
  g.fillStyle(0xaaddff);
  g.fillRect(6, 4, 12, 16);
  // Eyes
  g.fillStyle(0x00ffff);
  g.fillRect(6, 8, 4, 4);
  g.fillRect(14, 8, 4, 4);
  // Ice crown
  g.fillStyle(0xddeeff);
  g.fillRect(4, 0, 4, 4);
  g.fillRect(10, 0, 4, 6);
  g.fillRect(16, 0, 4, 4);
  // Arms/fists
  g.fillStyle(0x4488cc);
  g.fillRect(0, 10, 4, 8);
  g.fillRect(20, 10, 4, 8);
  g.generateTexture('boss_frostgiant', 24, 28);
  g.clear();

  // Void Lord (World 4) — cosmic final boss, 32×32
  g.fillStyle(0x110022);
  g.fillRect(4, 4, 24, 28);
  g.fillStyle(0x440088);
  g.fillRect(6, 6, 20, 24);
  g.fillStyle(0x8800ff);
  g.fillRect(8, 8, 16, 18);
  // Glowing eyes
  g.fillStyle(0xff44ff);
  g.fillRect(9, 12, 5, 5);
  g.fillRect(18, 12, 5, 5);
  g.fillStyle(0xffffff);
  g.fillRect(10, 13, 3, 3);
  g.fillRect(19, 13, 3, 3);
  // Crown/horns
  g.fillStyle(0xaa00ff);
  g.fillRect(6, 0, 4, 8);
  g.fillRect(14, 0, 4, 10);
  g.fillRect(22, 0, 4, 8);
  // Cloak tentacles
  g.fillStyle(0x220044);
  g.fillRect(0, 16, 6, 16);
  g.fillRect(26, 16, 6, 16);
  g.fillRect(4, 28, 24, 4);
  g.generateTexture('boss_voidlord', 32, 32);
  g.clear();

  // Boss projectile
  g.fillStyle(0xff4400);
  g.fillCircle(5, 5, 4);
  g.fillStyle(0xffaa00);
  g.fillCircle(5, 5, 2);
  g.generateTexture('boss_proj', 10, 10);
  g.clear();

  // Void projectile
  g.fillStyle(0x8800ff);
  g.fillCircle(5, 5, 4);
  g.fillStyle(0xcc44ff);
  g.fillCircle(5, 5, 2);
  g.generateTexture('boss_proj_void', 10, 10);
  g.clear();

  // HP bar segments
  g.fillStyle(0xff2222);
  g.fillRect(0, 0, 28, 8);
  g.fillStyle(0xff6666);
  g.fillRect(2, 2, 24, 2);
  g.generateTexture('boss_hp_full', 28, 8);
  g.clear();

  g.fillStyle(0x552222);
  g.fillRect(0, 0, 28, 8);
  g.generateTexture('boss_hp_empty', 28, 8);
  g.clear();

  // Boss flash white (for hit feedback)
  g.fillStyle(0xffffff);
  g.fillRect(0, 0, 32, 32);
  g.generateTexture('boss_flash', 32, 32);
  g.clear();

  g.destroy();
}

export function generateIconCanvas(size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);
  // Simple pixel-art icon: Nova character silhouette
  const s = size / 32;
  ctx.fillStyle = '#2d7a16';
  ctx.fillRect(12 * s, 2 * s, 8 * s, 6 * s); // hat
  ctx.fillStyle = '#ffcc99';
  ctx.fillRect(11 * s, 7 * s, 10 * s, 5 * s); // face
  ctx.fillStyle = '#2255aa';
  ctx.fillRect(10 * s, 12 * s, 12 * s, 8 * s); // body
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(13 * s, 20 * s, 6 * s, 6 * s); // legs
  ctx.fillStyle = '#5a3010';
  ctx.fillRect(12 * s, 26 * s, 4 * s, 3 * s); // shoes
  ctx.fillRect(17 * s, 26 * s, 4 * s, 3 * s);
  return c;
}
