// Game font — Press Start 2P (SIL Open Font License, free to use commercially)
// Loaded via Google Fonts in index.html; falls back to monospace
export const FONT = '"Press Start 2P", monospace';

export const TILE = 16;
export const SCALE = 3;
export const GAME_W = 480;
export const GAME_H = 270;

export const WORLDS = 4;            // 4 worlds (World 4 unlocked by 3-starring all)
export const LEVELS_PER_WORLD = 5;

export const GRAVITY = 900;
export const PLAYER_SPEED = 140;
export const PLAYER_RUN_SPEED = 220;
export const PLAYER_JUMP_VEL = -400;
export const COYOTE_TIME = 120;
export const JUMP_BUFFER_TIME = 100;

// Momentum (Mario-style acceleration model, all px/s²)
export const PLAYER_ACCEL = 900;        // ground acceleration toward target speed
export const PLAYER_TURN_ACCEL = 2400;  // deceleration when reversing direction (skid)
export const PLAYER_FRICTION = 900;     // ground deceleration when no input
export const PLAYER_AIR_DRAG = 200;     // air deceleration when no input
export const PLAYER_AIR_CONTROL = 0.65; // fraction of accel available mid-air
export const SKID_MIN_SPEED = 130;      // speed above which reversing triggers a skid
export const FALL_GRAVITY_BONUS = 350;  // extra gravity while falling (snappier arc)
export const JUMP_SPEED_BONUS = 0.15;   // jump velocity gained per px/s of run speed

// Dash
export const DASH_SPEED = 420;
export const DASH_DURATION = 160;     // ms
export const DASH_COOLDOWN = 900;     // ms
export const DASH_DOUBLE_TAP_WINDOW = 220; // ms between taps

// Wall jump
export const WALL_JUMP_VEL_X = 180;
export const WALL_JUMP_VEL_Y = -360;
export const WALL_SLIDE_GRAVITY = 120; // reduced gravity while sliding

// Crouch
export const CROUCH_SPEED = 70;
export const CROUCH_SLIDE_SPEED = 280;
export const CROUCH_SLIDE_DURATION = 350; // ms

// Coin magnet
export const MAGNET_RADIUS = 72;
export const MAGNET_PULL_SPEED = 180;
export const MAGNET_DURATION = 12000; // ms

// Scores
export const COIN_SCORE = 100;
export const ENEMY_STOMP_SCORE = 200;
export const ENEMY_MULTI_BONUS = 200;
export const POWERUP_SCORE = 1000;
export const FLAGPOLE_BASE_SCORE = 1000;
export const TIME_BONUS_FACTOR = 50;
export const PERFECT_CLEAR_BONUS = 5000; // all enemies + all coins

// Lives / timing
export const PLAYER_LIVES_START = 3;
export const INVINCIBILITY_DURATION = 2500;
export const STAR_DURATION = 10000;

// Boss
export const BOSS_HP = 3;
export const BOSS_SHOOT_INTERVAL_BASE = 2200; // ms
export const BOSS_PROJ_SPEED = 160;

// Daily challenge
export const DAILY_MODIFIERS = {
  speed_run:       { label: '⚡ SPEED RUN',      desc: 'Half the time limit!' },
  coin_rush:       { label: '🪙 COIN RUSH',       desc: '5× coin score!' },
  double_enemies:  { label: '💀 DOUBLE TROUBLE', desc: '2× enemies!' },
  no_powerups:     { label: '🚫 POWERLESS',       desc: 'No power-ups!' },
  mirror:          { label: '🪞 MIRROR MODE',     desc: 'Level is flipped!' },
};

export const COLORS = {
  sky1: 0x5c94fc, sky2: 0x9dbfff,
  ground: 0x7a5230, groundTop: 0x5c7a28,
  brick: 0xa0522d, brickDark: 0x7a3e1e,
  pipe: 0x2e8b1a, pipeDark: 0x1a5c0e,
  coin: 0xffd700, coinDark: 0xc8a000,
  mushroom: 0xff4444, mushroomTop: 0xff7777,
  fireflower: 0xff8c00, star: 0xffff00,
  magnet: 0xaa44ff,
  skin: 0xffcc99, hair: 0x4a2800,
  hatGreen: 0x2d7a16, shirtWhite: 0xf0f0f0,
  pantsBlue: 0x2255aa, shoeBrown: 0x5a3010,
  goomba: 0x8b4513, goombaDark: 0x5c2e00,
  koopa: 0x3a7a1a, koopaDark: 0x1e4a0a, koopaSkin: 0xffdd88,
  bgMtn: 0x8fa8c8, cloud: 0xffffff,
  uiBar: 0x1a1a2e, uiText: 0xffffff, uiGold: 0xffd700,
  flagGreen: 0x22aa22, checkpoint: 0xff8800,
  lava0: 0xff4400, lava1: 0xff6600, lava2: 0xff8800,
  water0: 0x2255cc, water1: 0x3377ee,
  void0: 0x110022, void1: 0x220044,
  boss: 0xcc2222,
};

// Skin shop — palette overrides applied to the nova_* sprites.
// Keys: G hat, R hat shadow, W shirt, B pants, S skin, E shoes, D eyes
export const SKINS = [
  { id: 'classic',   name: 'CLASSIC',   price: 0,    colors: null },
  { id: 'crimson',   name: 'CRIMSON',   price: 150,  colors: { G: 0xcc2233, R: 0x771122, W: 0xffe4e4, B: 0x33112a } },
  { id: 'shadow',    name: 'SHADOW',    price: 300,  colors: { G: 0x222233, R: 0x111122, W: 0x444455, B: 0x111118, D: 0xff2222 } },
  { id: 'aqua',      name: 'AQUA',      price: 500,  colors: { G: 0x1199cc, R: 0x0d6688, W: 0xddffff, B: 0x115577 } },
  { id: 'bubblegum', name: 'BUBBLEGUM', price: 750,  colors: { G: 0xff66aa, R: 0xcc3377, W: 0xfff0f5, B: 0x993366 } },
  { id: 'gold',      name: 'GOLD',      price: 1200, colors: { G: 0xffcc00, R: 0xcc9900, W: 0xfff8dd, B: 0xaa7700, E: 0x886600 } },
  { id: 'frost',     name: 'FROST',     price: 1800, colors: { G: 0x88ddff, R: 0x44aacc, W: 0xffffff, B: 0x4477aa, S: 0xeedfff, D: 0x2266ff } },
  { id: 'void',      name: 'VOID',      price: 2500, colors: { G: 0x8800ff, R: 0x550099, W: 0x221133, B: 0x110022, D: 0xff44ff } },
];

// Daily streak — coins awarded per consecutive day, capped at day 7
export const STREAK_COIN_BASE = 25;
export const STREAK_DAY_CAP = 7;

export const SCENES = {
  BOOT:       'BootScene',
  MENU:       'MainMenuScene',
  WORLDMAP:   'WorldMapScene',
  GAME:       'GameScene',
  UI:         'UIScene',
  PAUSE:      'PauseScene',
  LVLCOMPLETE:'LevelCompleteScene',
  GAMEOVER:   'GameOverScene',
  LEADERBOARD:'LeaderboardScene',
  DAILY:      'DailyChallengeScene',
  SHOP:       'ShopScene',
};

// Supabase (optional — set in .env.local)
export const SUPABASE_URL  = import.meta.env?.VITE_SUPABASE_URL  || '';
export const SUPABASE_ANON = import.meta.env?.VITE_SUPABASE_ANON || '';
