export const TILE = 16;
export const SCALE = 3; // Each pixel tile renders at 3x for crisp pixel art feel
export const GAME_W = 480;
export const GAME_H = 270;

export const WORLDS = 3;
export const LEVELS_PER_WORLD = 5;

export const GRAVITY = 900;
export const PLAYER_SPEED = 140;
export const PLAYER_RUN_SPEED = 220;
export const PLAYER_JUMP_VEL = -400;
export const PLAYER_JUMP_VEL_BIG = -460;
export const COYOTE_TIME = 120;    // ms
export const JUMP_BUFFER_TIME = 100; // ms

export const COIN_SCORE = 100;
export const ENEMY_STOMP_SCORE = 200;
export const ENEMY_MULTI_BONUS = 200; // extra per consecutive stomp
export const POWERUP_SCORE = 1000;
export const FLAGPOLE_BASE_SCORE = 1000;
export const TIME_BONUS_FACTOR = 50;

export const PLAYER_LIVES_START = 3;
export const INVINCIBILITY_DURATION = 2500; // ms after hit
export const STAR_DURATION = 10000; // ms

export const COLORS = {
  sky1:       0x5c94fc,
  sky2:       0x9dbfff,
  ground:     0x7a5230,
  groundTop:  0x5c7a28,
  brick:      0xa0522d,
  brickDark:  0x7a3e1e,
  pipe:       0x2e8b1a,
  pipeDark:   0x1a5c0e,
  coin:       0xffd700,
  coinDark:   0xc8a000,
  mushroom:   0xff4444,
  mushroomTop:0xff7777,
  fireflower: 0xff8c00,
  star:       0xffff00,
  skin:       0xffcc99,
  hair:       0x4a2800,
  hatGreen:   0x2d7a16,
  shirtWhite: 0xf0f0f0,
  pantsBlue:  0x2255aa,
  shoeBrown:  0x5a3010,
  goomba:     0x8b4513,
  goombaDark: 0x5c2e00,
  koopa:      0x3a7a1a,
  koopaDark:  0x1e4a0a,
  koopaSkin:  0xffdd88,
  bgMtn:      0x8fa8c8,
  cloud:      0xffffff,
  uiBar:      0x1a1a2e,
  uiText:     0xffffff,
  uiGold:     0xffd700,
  flagGreen:  0x22aa22,
  checkpoint: 0xff8800,
};

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
};
