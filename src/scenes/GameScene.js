import {
  SCENES, TILE, COLORS, PLAYER_LIVES_START,
  FLAGPOLE_BASE_SCORE, TIME_BONUS_FACTOR, PERFECT_CLEAR_BONUS,
  MAGNET_RADIUS, DAILY_MODIFIERS, FONT,
} from '../config.js';
import { playMusic, stopMusic, SFX } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import QuestSystem from '../systems/QuestSystem.js';
import InputManager from '../systems/InputManager.js';
import { getLevel } from '../levels/levelData.js';
import { markDoneToday } from '../systems/DailyChallenge.js';
import Player from '../objects/Player.js';
import Goomba from '../objects/Goomba.js';
import Koopa from '../objects/Koopa.js';
import Spiny from '../objects/Spiny.js';
import Boss from '../objects/Boss.js';
import Coin from '../objects/Coin.js';
import PowerUp from '../objects/PowerUp.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.GAME }); }

  init(data) {
    this.currentWorld   = data.world || 1;
    this.currentLevel   = data.level || 1;
    this.lives          = data.lives  ?? (SaveSystem.get('lives') || PLAYER_LIVES_START);
    this.score          = data.score  ?? (SaveSystem.get('score') || 0);
    this.coins          = data.coins  ?? (SaveSystem.get('coins') || 0);
    this._dailyCfg      = data.daily  || null;   // daily challenge config
    this._checkpointed  = false;
    this._checkpointX   = null;
    this._levelComplete = false;
    this._gamePaused    = false;
    this._storedJumpChain = 0;
    this._introComplete = false;
    this._bossActive    = false;
    this._bossDefeated  = false;
    this._totalEnemies  = 0;
    this._killedEnemies = 0;
    this._totalCoins    = 0;
    this._collectedCoins= 0;
    this._coinScoreMult = (data.daily?.coinScoreMult) || 1;
    this._levelStartTime= Date.now();
    this._speedrunBest  = SaveSystem.getLevel(this.currentWorld, this.currentLevel)?.bestTime || null;
    this._startCoins    = this.coins;
    // Snapshot for instant retry (R) — rewinds to the state at level start
    this._initData = {
      world: this.currentWorld, level: this.currentLevel,
      lives: this.lives, score: this.score, coins: this.coins,
      daily: this._dailyCfg,
    };
  }

  create() {
    const raw = getLevel(this.currentWorld, this.currentLevel);
    if (!raw) { this.scene.start(SCENES.WORLDMAP); return; }

    // Apply daily challenge modifiers
    this.levelData = this._applyDailyModifiers(raw);
    this.levelWidth = this.levelData.width;

    this._buildBackground(this.levelData);
    this.physics.world.setBounds(0, 0, this.levelData.width, this.levelData.height + 100);

    // Groups
    this.groundGroup   = this.physics.add.staticGroup();
    this.platformGroup = this.physics.add.staticGroup();
    this.brickGroup    = this.physics.add.staticGroup();
    this.questionGroup = this.physics.add.staticGroup();
    this.spikeGroup    = this.physics.add.staticGroup();
    this.pipeGroup     = this.physics.add.staticGroup();
    this.lavaGroup     = this.physics.add.staticGroup();
    this.enemyGroup    = this.physics.add.group({ collideWorldBounds: false });
    this.coinGroup     = this.physics.add.group();
    this.powerUpGroup  = this.physics.add.group();
    this.fireballGroup = this.physics.add.group({ allowGravity: true, bounceY: 0.6 });
    this.movingPlatforms = [];
    this._animatedTiles = [];
    this.boss = null;

    this._buildLevel(this.levelData);
    this._buildFlagpole(this.levelData);
    if (this.levelData.checkpoint) this._buildCheckpoint(this.levelData);
    if (this.levelData.boss) this._spawnBoss(this.levelData.boss);

    // Count totals for completion %
    this._totalEnemies = this.enemyGroup.getLength();
    this._totalCoins   = this.coinGroup.getLength();

    // Player
    this.player = new Player(this, this.levelData.start.x, this.levelData.start.y);
    this.player.setFireballs(this.fireballGroup);

    // Particles
    this.dustEmitter = this.add.particles(0, 0, 'particle_dust', {
      lifespan: 200, speed: { min: 10, max: 30 }, scale: { start: 1, end: 0 },
      gravityY: 80, emitting: false,
    });
    this.coinEmitter = this.add.particles(0, 0, 'particle_coin', {
      lifespan: 400, speed: { min: 20, max: 60 }, scale: { start: 1, end: 0 },
      gravityY: 120, emitting: false,
    });

    // Camera
    this.cameras.main
      .setBounds(0, 0, this.levelData.width, this.levelData.height + 100)
      .startFollow(this.player, true, 0.1, 0.1)
      .setDeadzone(80, 40);

    // Input
    this.cursors  = this.input.keyboard.createCursorKeys();
    this.runKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.fireKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.pauseKey.on('down', () => this._togglePause());
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.restartKey.on('down', () => this._quickRestart());

    this._input = new InputManager(this);
    this._buildTouchControls();

    this.input.gamepad?.on('connected',    (pad) => this._showNotice(`🎮 ${pad.id.substring(0,18)} connected`));
    this.input.gamepad?.on('disconnected', ()    => this._showNotice('🎮 Controller disconnected'));

    // Collisions
    this._setupCollisions();

    // Events
    this.events.on('scoreAdd',    this._addScore,   this);
    this.events.on('collectCoin', this._addCoins,   this);
    this.events.on('playerDied',  this._onPlayerDied, this);
    this.events.on('starStart',   () => playMusic('starmode'));
    this.events.on('starEnd',     () => playMusic(this.levelData.music));
    this.events.on('enemyKilled', () => { this._killedEnemies++; this._updateCompletionPct(); });
    this.events.on('bossDefeated',this._onBossDefeated, this);

    // UI overlay
    this.scene.launch(SCENES.UI, {
      world: this.currentWorld, level: this.currentLevel,
      lives: this.lives, score: this.score, coins: this.coins,
      timeLimit: this.levelData.timeLimit,
      speedrunBest: this._speedrunBest,
      isDaily: !!this._dailyCfg,
      modifiers: this.levelData.modifiers || [],
    });
    this.uiScene = this.scene.get(SCENES.UI);

    playMusic(this.levelData.music);
    this.timeRemaining = this.levelData.timeLimit;

    // Freeze player during intro, then show intro
    this.player.body.setAllowGravity(false);
    this.player.body.setVelocity(0, 0);
    this._showLevelIntro();
  }

  // ── Daily modifiers ──────────────────────────────────────────────

  _applyDailyModifiers(raw) {
    if (!this._dailyCfg) return raw;
    const mods = this._dailyCfg.modifiers || [];
    const cfg = { ...raw, modifiers: mods };

    if (mods.includes('speed_run'))      cfg.timeLimit = Math.max(60, Math.floor(raw.timeLimit * 0.45));
    if (mods.includes('coin_rush'))      this._coinScoreMult = 5;
    if (mods.includes('double_enemies')) cfg._doubleEnemies = true;
    if (mods.includes('no_powerups'))    cfg._noPowerups = true;
    if (mods.includes('mirror'))         cfg._mirror = true;

    return cfg;
  }

  // ── Level intro cutscene ─────────────────────────────────────────

  _showLevelIntro() {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(500);

    const worldNames = ['', 'GRASSY PLAINS', 'SCORCHING DESERT', 'FROZEN PEAKS', 'STAR DIMENSION'];
    const wLabel = this.add.text(width / 2, height / 2 - 32,
      `WORLD ${this.currentWorld}  ${worldNames[this.currentWorld] || ''}`, {
        fontSize: '11px', fontFamily: FONT, color: '#aaaaff',
        stroke: '#000', strokeThickness: 2,
      }).setScrollFactor(0).setDepth(501).setOrigin(0.5).setAlpha(0);

    const lLabel = this.add.text(width / 2, height / 2 - 10,
      `${this.levelData.name}`, {
        fontSize: '14px', fontFamily: FONT, color: '#ffd700',
        stroke: '#000', strokeThickness: 3,
      }).setScrollFactor(0).setDepth(501).setOrigin(0.5).setAlpha(0);

    // Modifier banners
    const mods = this.levelData.modifiers || [];
    mods.forEach((m, i) => {
      const modCfg = DAILY_MODIFIERS[m];
      if (!modCfg) return;
      this.add.text(width / 2, height / 2 + 14 + i * 15, modCfg.label, {
        fontSize: '9px', fontFamily: FONT, color: '#ff8800',
        stroke: '#000', strokeThickness: 2,
      }).setScrollFactor(0).setDepth(501).setOrigin(0.5);
    });

    this.tweens.add({
      targets: [wLabel, lLabel], alpha: 1, y: `+=${5}`,
      duration: 350, ease: 'Back.easeOut',
    });

    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: [overlay, wLabel, lLabel], alpha: 0, duration: 350,
        onComplete: () => {
          overlay.destroy(); wLabel.destroy(); lLabel.destroy();
          this._introComplete = true;
          this.player.body.setAllowGravity(true);
        },
      });
    });
  }

  // ── Background ─────────────────────────────────────────────────

  _buildBackground(lvl) {
    const w = lvl.width;
    const h = lvl.height;
    this.add.rectangle(w / 2, h / 2, w, h, lvl.bgColor).setDepth(-10);

    this._parallax = [];
    if (lvl.theme !== 'cave' && lvl.theme !== 'void') {
      const mtns = [];
      for (let i = 0; i < Math.ceil(w / 60) + 2; i++) {
        mtns.push(this.add.image(i * 60 + 30, h - 60, 'mountain').setDepth(-9).setAlpha(0.6));
      }
      this._parallax.push({ items: mtns, factor: 0.3 });

      const clouds = [];
      for (let i = 0; i < 14; i++) {
        clouds.push(
          this.add.image(
            Phaser.Math.Between(0, w), Phaser.Math.Between(20, 80),
            Math.random() > 0.5 ? 'cloud_big' : 'cloud_small'
          ).setDepth(-8).setAlpha(0.9)
        );
      }
      this._parallax.push({ items: clouds, factor: 0.15 });
    }

    // Void world — star field
    if (lvl.theme === 'void') {
      for (let i = 0; i < Math.ceil(w / 50); i++) {
        const sx = Phaser.Math.Between(0, w);
        const sy = Phaser.Math.Between(0, h);
        const star = this.add.image(sx, sy, 'star_twinkle').setAlpha(Math.random() * 0.6 + 0.2).setDepth(-9);
        this.tweens.add({ targets: star, alpha: 0.05, duration: Phaser.Math.Between(400, 1800), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1000) });
      }
    }
  }

  // ── Level building ─────────────────────────────────────────────

  _buildLevel(lvl) {
    const T = TILE;
    const groundY = lvl.height - T;
    const mirror = lvl._mirror;
    const mX = (x) => mirror ? (lvl.width / T - x) : x;

    const topTex = lvl.theme === 'desert' ? 'tile_sand_top' :
                   lvl.theme === 'snow' || lvl.theme === 'cave' ? 'tile_snow_top' :
                   lvl.theme === 'void' ? 'tile_void_top' : 'tile_ground_top';
    const midTex = lvl.theme === 'desert' ? 'tile_sand' :
                   lvl.theme === 'snow' || lvl.theme === 'cave' ? 'tile_snow' :
                   lvl.theme === 'void' ? 'tile_void' : 'tile_ground';

    const place = (group, gx, gy, tex) => {
      const t = group.create(mX(gx) * T + T / 2, gy, tex);
      t.body.setSize(T, T);
      t.refreshBody();
      return t;
    };

    for (const seg of lvl.grounds) {
      for (let gx = seg.x; gx < seg.x + seg.w; gx++) {
        place(this.groundGroup, gx, groundY - T + T / 2, topTex);
        for (let dy = 1; dy <= 3; dy++) place(this.groundGroup, gx, groundY - T + dy * T + T / 2, midTex);
      }
    }
    for (const plat of lvl.platforms) {
      for (let px = plat.x; px < plat.x + plat.w; px++) {
        place(this.platformGroup, px, plat.y * T + T / 2, topTex);
      }
    }

    // Question blocks (skip if no_powerups modifier — just give coins)
    this._questionStates = {};
    for (const q of lvl.questions) {
      const key = `${q.x},${q.y}`;
      const item = lvl._noPowerups && q.item !== 'coin' ? 'coin' : q.item;
      this._questionStates[key] = { used: false, item };
      const block = this.questionGroup.create(mX(q.x) * T + T / 2, q.y * T + T / 2, 'tile_question0');
      block.setData('qkey', key);
      block.body.setSize(T, T);
      block.refreshBody();
      if (!this.anims.exists('question_anim')) {
        this.anims.create({ key: 'question_anim', frames: [{ key: 'tile_question0' }, { key: 'tile_question1' }], frameRate: 3, repeat: -1 });
      }
      block.play('question_anim');
    }

    for (const br of lvl.bricks) {
      place(this.brickGroup, br.x, br.y * T + T / 2, 'tile_brick');
    }

    // Pipes
    for (const pipe of (lvl.pipes || [])) {
      for (let ph = 0; ph < pipe.h; ph++) {
        const py2 = (lvl.height / T - 1 - ph) * T + T / 2;
        const lKey = ph === pipe.h - 1 ? 'tile_pipe_top_l' : 'tile_pipe_l';
        const rKey = ph === pipe.h - 1 ? 'tile_pipe_top_r' : 'tile_pipe_r';
        const pl = this.pipeGroup.create(mX(pipe.x) * T + T / 2, py2, lKey);
        const pr = this.pipeGroup.create(mX(pipe.x + 1) * T + T / 2, py2, rKey);
        [pl, pr].forEach(t => { t.body.setSize(T, T); t.refreshBody(); });
      }
    }

    // Lava tiles (animated)
    for (const seg of (lvl.lava || [])) {
      for (let lx = seg.x; lx < seg.x + seg.w; lx++) {
        const tile = this.lavaGroup.create(mX(lx) * T + T / 2, groundY - T + T / 2, 'tile_lava_0');
        tile.body.setSize(T, T);
        tile.refreshBody();
        this._animatedTiles.push({ sprite: tile, frames: ['tile_lava_0','tile_lava_1','tile_lava_2'], rate: 4, elapsed: 0, idx: Math.floor(Math.random()*3) });
      }
    }

    // Coins (doubled if coin_rush modifier)
    for (const [cx, cy] of (lvl.coins || [])) {
      this.coinGroup.add(new Coin(this, mX(cx) * T + T / 2, cy * T + T / 2));
    }
    this._totalCoins = this.coinGroup.getLength();

    // Enemies
    let enemyList = [...(lvl.enemies || [])];
    if (lvl._doubleEnemies) enemyList = [...enemyList, ...enemyList.map(e => ({ ...e, x: e.x + T * 2 }))];

    for (const en of enemyList) {
      const ex = mirror ? (lvl.width - en.x) : en.x;
      let enemy;
      if (en.type === 'goomba')      enemy = new Goomba(this, ex, en.y);
      else if (en.type === 'koopa')  enemy = new Koopa(this, ex, en.y);
      else if (en.type === 'spiny')  enemy = new Spiny(this, ex, en.y);
      if (enemy) this.enemyGroup.add(enemy);
    }

    // Spikes
    for (const sp of (lvl.spikes || [])) {
      const spike = this.spikeGroup.create(mirror ? (lvl.width - sp.x) : sp.x, sp.y, 'spike');
      spike.body.setSize(20, 8);
      spike.refreshBody();
    }

    // Moving platforms
    for (const mp of (lvl.movingPlatforms || [])) {
      const plat = this.physics.add.image(mp.x, mp.y, 'moving_platform');
      plat.setImmovable(true);
      plat.body.setAllowGravity(false);
      plat.setData('mpConfig', mp);
      plat.setData('mpDir', 1);
      plat.setData('mpStart', mp.axis === 'x' ? mp.x : mp.y);
      this.movingPlatforms.push(plat);
    }

    // Coin magnet power-up: add a couple to each level 3+ randomly
    if (this.currentWorld >= 1 && Math.random() > 0.5) {
      const mx2 = Phaser.Math.Between(60, lvl.width - 60);
      const my2 = this.levelData.height - 60;
      const pu = new PowerUp(this, mx2, my2, 'magnet');
      this.powerUpGroup.add(pu);
      [this.groundGroup, this.platformGroup].forEach(g => this.physics.add.collider(pu, g));
    }
  }

  _buildFlagpole(lvl) {
    const fx = lvl._mirror ? (lvl.width - lvl.flagpole.x) : lvl.flagpole.x;
    const fy = lvl.height - 100;
    this.flagpole = this.add.image(fx, fy, 'flagpole').setOrigin(0.5, 1).setDepth(3);
    this.flagTrigger = this.add.zone(fx, fy, 16, 96).setOrigin(0.5, 1);
    this.physics.add.existing(this.flagTrigger, true);
  }

  _buildCheckpoint(lvl) {
    const cx = lvl._mirror ? (lvl.width - lvl.checkpoint.x) : lvl.checkpoint.x;
    const cy = lvl.height - TILE * 2;
    this.checkpointSprite = this.add.image(cx, cy, 'checkpoint').setDepth(3);
    this.checkpointZone   = this.add.zone(cx, cy, 12, 32);
    this.physics.add.existing(this.checkpointZone, true);
  }

  _spawnBoss(bossCfg) {
    this._bossActive = true;
    this.boss = new Boss(this, bossCfg.x, bossCfg.y, bossCfg.type);
    // Boss collides with ground
    [this.groundGroup, this.platformGroup].forEach(g => this.physics.add.collider(this.boss, g));
    // Boss projectiles collide with player
    this.physics.add.overlap(this.boss.projectiles, null, null, null, this);
  }

  // ── Touch Controls ────────────────────────────────────────────

  _buildTouchControls() {
    const { width, height } = this.scale;
    const bh = 70; const lw = 65; const jw = 70; const aw = 48;

    const zones = {
      left:  { x: 0,                  y: height - bh, w: lw, h: bh },
      right: { x: lw,                 y: height - bh, w: lw, h: bh },
      fire:  { x: width - jw - aw*2,  y: height - bh, w: aw, h: bh },
      run:   { x: width - jw - aw,    y: height - bh, w: aw, h: bh },
      jump:  { x: width - jw,         y: height - bh, w: jw, h: bh },
    };
    this._input.setTouchZones(zones);

    const g = this.add.graphics().setScrollFactor(0).setDepth(90).setAlpha(0.55);
    const drawBtn = (z, color, label, tx, ty) => {
      g.fillStyle(color, 0.18);
      g.fillRoundedRect(z.x + 2, z.y + 2, z.w - 4, z.h - 4, 10);
      g.strokeRoundedRect(z.x + 2, z.y + 2, z.w - 4, z.h - 4, 10);
      this.add.text(tx, ty, label, {
        fontSize: label.length > 1 ? '10px' : '18px', fontFamily: FONT, color: '#ffffff',
      }).setScrollFactor(0).setDepth(91).setOrigin(0.5);
    };
    g.lineStyle(1.5, 0xffffff, 0.4);
    drawBtn(zones.left,  0x88ccff, '◀', zones.left.x  + lw / 2,       height - bh / 2);
    drawBtn(zones.right, 0x88ccff, '▶', zones.right.x + lw / 2,       height - bh / 2);
    drawBtn(zones.fire,  0xff8800, 'X',  zones.fire.x  + aw / 2,       height - bh / 2);
    drawBtn(zones.run,   0xffcc00, 'RUN',zones.run.x   + aw / 2,       height - bh / 2);
    drawBtn(zones.jump,  0x4488ff, '▲',  zones.jump.x  + jw / 2,       height - bh / 2);

    const pauseBtn = this.add.text(width / 2, 6, '  ⏸  ', {
      fontSize: '11px', fontFamily: FONT, color: '#ffffff',
      backgroundColor: '#00000066', padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(91).setOrigin(0.5, 0).setInteractive();
    pauseBtn.on('pointerdown', () => this._togglePause());

    this._padIndicator = this.add.text(width - 4, 8, '', {
      fontSize: '6px', fontFamily: FONT, color: '#aaffaa',
    }).setScrollFactor(0).setDepth(91).setOrigin(1, 0);
  }

  // ── Collisions ────────────────────────────────────────────────

  _setupCollisions() {
    this._setupPlayerCollisions();

    const worldGroups = [this.groundGroup, this.platformGroup, this.pipeGroup];
    this.enemyGroup.getChildren().forEach(e => {
      worldGroups.forEach(g => this.physics.add.collider(e, g));
    });

    this.physics.add.overlap(this.fireballGroup, this.enemyGroup, this._handleFireballEnemy, null, this);

    const colGroups = [this.groundGroup, this.platformGroup, this.brickGroup, this.questionGroup, this.pipeGroup];
    colGroups.forEach(g => {
      this.physics.add.collider(this.fireballGroup, g, (fb) => {
        if (fb.body.blocked.left || fb.body.blocked.right) fb.setActive(false).setVisible(false).body.reset(-100,-100);
      });
    });

    this.physics.add.collider(this.enemyGroup, this.enemyGroup, (a, b) => {
      if (a.body.velocity.x > 0) a.body.setVelocityX(-Math.abs(a.body.velocity.x));
      else a.body.setVelocityX(Math.abs(a.body.velocity.x));
    });

    this.physics.add.overlap(this.enemyGroup, this.enemyGroup, (a, b) => {
      if (a instanceof Koopa && a.isShell && a.shellMoving && !b.isDead) b.hitByStar?.(1);
      if (b instanceof Koopa && b.isShell && b.shellMoving && !a.isDead) a.hitByStar?.(1);
    });
  }

  _setupPlayerCollisions() {
    const p = this.player;
    const colGroups = [this.groundGroup, this.platformGroup, this.brickGroup, this.questionGroup, this.pipeGroup];
    colGroups.forEach(g => this.physics.add.collider(p, g));
    this.movingPlatforms.forEach(mp => this.physics.add.collider(p, mp));
    this.physics.add.collider(p, this.questionGroup, this._hitQuestion, null, this);
    this.physics.add.collider(p, this.brickGroup, this._hitBrick, null, this);
    this.physics.add.overlap(p, this.coinGroup, (_, coin) => { coin.collect?.(); this._collectedCoins++; this._updateCompletionPct(); });
    this.physics.add.overlap(p, this.powerUpGroup, (_, pu) => pu.collect?.(p));
    this.physics.add.overlap(p, this.enemyGroup, this._handlePlayerEnemyContact, null, this);
    this.physics.add.overlap(p, this.spikeGroup, () => p.takeDamage());
    this.physics.add.overlap(p, this.lavaGroup, () => p.takeDamage());
    if (this.checkpointZone) this.physics.add.overlap(p, this.checkpointZone, this._hitCheckpoint, null, this);
    if (!this._bossActive) this.physics.add.overlap(p, this.flagTrigger, this._hitFlagpole, null, this);

    // Boss interactions
    if (this.boss) {
      this.physics.add.overlap(p, this.boss, this._handleBossContact, null, this);
      this.physics.add.overlap(p, this.boss.projectiles, (player, proj) => {
        if (proj.active) { proj.setActive(false).setVisible(false); player.takeDamage(); }
      });
      this.physics.add.overlap(this.fireballGroup, this.boss, (fb, boss) => {
        if (fb.active) { fb.setActive(false).setVisible(false).body.reset(-100,-100); boss.fireballHit(); }
      });
    }
  }

  // ── Collision handlers ────────────────────────────────────────

  _hitQuestion(player, block) {
    if (player.body.velocity.y >= 0) return;
    const key = block.getData('qkey');
    if (!key) return;
    const state = this._questionStates[key];
    if (!state || state.used) return;
    state.used = true;
    block.stop().setTexture('tile_used');
    block.body.reset(block.x, block.y);
    this.tweens.add({ targets: block, y: block.y - 4, duration: 80, yoyo: true });
    if (state.item === 'coin') {
      new Coin(this, block.x, block.y - TILE, true);
      SFX.coin();
    } else {
      const pu = new PowerUp(this, block.x, block.y - TILE, state.item);
      this.powerUpGroup.add(pu);
      [this.groundGroup, this.platformGroup].forEach(g => this.physics.add.collider(pu, g));
    }
    SFX.break();
  }

  _hitBrick(player, brick) {
    if (player.body.velocity.y >= 0) return;
    if (player.state === 'small') {
      this.tweens.add({ targets: brick, y: brick.y - 4, duration: 80, yoyo: true });
      SFX.break();
      return;
    }
    SFX.break();
    this.cameras.main.shake(60, 0.006);
    this.events.emit('scoreAdd', 50, brick.x, brick.y);
    this.brickGroup.remove(brick, true, true);
    this.coinEmitter.emitParticleAt(brick.x, brick.y, 5);
  }

  _handlePlayerEnemyContact(player, enemy) {
    if (player.isDead || enemy.isDead) return;
    if (player.hasStar) {
      enemy.hitByStar?.(this._storedJumpChain);
      this._storedJumpChain++;
      return;
    }
    if (player.body.velocity.y > 0 && player.y < enemy.y - 4) {
      if (enemy instanceof Spiny) { enemy.stomp(player); }
      else {
        enemy.stomp(player, this._storedJumpChain);
        this._storedJumpChain++;
        this.time.delayedCall(200, () => { this._storedJumpChain = 0; });
        // Strong stomp feedback
        this.cameras.main.shake(80, 0.008);
        this._flashScreen(0xffffff, 50, 0.08);
      }
      return;
    }
    player.takeDamage();
    this._storedJumpChain = 0;
  }

  _handleBossContact(player, boss) {
    if (boss.isDead || boss.stunned) return;
    if (player.hasStar) { boss.hit(); return; }
    // Stomp boss from above
    if (player.body.velocity.y > 20 && player.y < boss.y - boss.cfg.h * 0.5) {
      boss.stompBoss(player);
    } else {
      player.takeDamage();
    }
  }

  _handleFireballEnemy(fireball, enemy) {
    if (enemy.isDead) return;
    fireball.setActive(false).setVisible(false).body.reset(-100,-100);
    if (enemy instanceof Spiny) enemy.hitByFireball?.();
    else enemy.hitByStar?.(0);
    SFX.stomp();
  }

  _hitCheckpoint(player, zone) {
    if (this._checkpointed) return;
    this._checkpointed = true;
    this._checkpointX = player.x;
    SFX.checkpoint();
    if (this.checkpointSprite) this.tweens.add({ targets: this.checkpointSprite, tint: 0x00ff00, duration: 300 });
    this.events.emit('scoreAdd', 500, player.x, player.y);
    this._showNotice('CHECKPOINT! ✓');
  }

  _hitFlagpole(player, zone) {
    if (this._levelComplete || player.isDead) return;
    if (this._bossActive && !this._bossDefeated) {
      this._showNotice('Defeat the boss first!');
      return;
    }
    this._levelComplete = true;
    stopMusic();
    SFX.flagpole();

    const heightBonus = Math.max(0, Math.floor((this.levelData.height - player.y) * 2));
    const timeBonus   = Math.floor(this.timeRemaining) * TIME_BONUS_FACTOR;
    this.score += FLAGPOLE_BASE_SCORE + heightBonus + timeBonus;

    player.body.setVelocity(0, 0);
    player.body.setAllowGravity(false);
    const flagX = zone.x + 16;
    this.tweens.add({
      targets: player, x: flagX, duration: 200, ease: 'Linear',
      onComplete: () => {
        this.tweens.add({
          targets: player, y: this.levelData.height - 32, duration: 600, ease: 'Linear',
          onComplete: () => this._completeLevel(timeBonus, heightBonus),
        });
      },
    });
    this.coinEmitter.emitParticleAt(zone.x, zone.y, 10);
  }

  _onBossDefeated() {
    this._bossDefeated = true;
    this._bossActive = false;
    this.boss = null;
    this.score += 5000;
    this.events.emit('scoreAdd', 5000, this.levelData.width / 2, 100);
    this._showNotice('BOSS DEFEATED! 🎉');
    SFX.levelwin();
    this.cameras.main.flash(400, 255, 220, 0);

    // Enable flagpole
    this.time.delayedCall(1500, () => {
      if (!this._levelComplete) {
        this.physics.add.overlap(this.player, this.flagTrigger, this._hitFlagpole, null, this);
        this._showNotice('Reach the flagpole!');
      }
    });
  }

  _completeLevel(timeBonus, heightBonus) {
    SFX.levelwin();

    // Stars
    let stars = 1;
    if (!this.player.damageTakenThisLevel) stars = 2;
    if (!this.player.damageTakenThisLevel && this.timeRemaining > this.levelData.timeLimit * 0.5) stars = 3;

    // Completion %
    const enemyPct = this._totalEnemies > 0 ? this._killedEnemies / this._totalEnemies : 1;
    const coinPct  = this._totalCoins   > 0 ? this._collectedCoins / this._totalCoins  : 1;
    const clearPct = Math.round((enemyPct + coinPct) / 2 * 100);

    if (clearPct === 100) this.score += PERFECT_CLEAR_BONUS;

    // Speedrun comparison
    const elapsed = (Date.now() - this._levelStartTime) / 1000;
    const isNewBest = !this._speedrunBest || elapsed < this._speedrunBest;
    if (isNewBest) SFX.new_best();

    // Daily challenge tracking
    if (this._dailyCfg) markDoneToday(this.score);

    QuestSystem.onLevelComplete(
      this.currentWorld, this.currentLevel,
      this.levelData.timeLimit - this.timeRemaining,
      this.player.damageTakenThisLevel,
      this.player.hasMaxCombo4
    );
    SaveSystem.setLevel(this.currentWorld, this.currentLevel, {
      completed: true, stars, bestTime: elapsed,
    });
    SaveSystem.set('score', this.score);
    SaveSystem.set('coins', this.coins);
    SaveSystem.set('lives', this.lives);
    SaveSystem.addHighScore('NOVA', this.score);
    SaveSystem.save();

    this.time.delayedCall(1500, () => {
      this.scene.stop(SCENES.UI);
      this.scene.start(SCENES.LVLCOMPLETE, {
        world: this.currentWorld, level: this.currentLevel,
        score: this.score, coins: this.coins, lives: this.lives,
        stars, timeBonus, heightBonus,
        clearPct, isNewBest, elapsed,
        coinsEarned: Math.max(0, this.coins - this._startCoins),
        daily: this._dailyCfg,
      });
    });
  }

  // ── Death / Respawn ──────────────────────────────────────────

  _onPlayerDied() {
    this.lives--;
    SaveSystem.set('lives', this.lives);
    SaveSystem.save();

    if (this.lives <= 0) {
      this.scene.stop(SCENES.UI);
      stopMusic();
      this.time.delayedCall(500, () => {
        this.scene.start(SCENES.GAMEOVER, {
          world: this.currentWorld, level: this.currentLevel, score: this.score,
        });
      });
    } else {
      this.time.delayedCall(1200, () => {
        const rx = this._checkpointed ? this._checkpointX : this.levelData.start.x;
        this.player.destroy();
        this.player = new Player(this, rx, this.levelData.start.y);
        this.player.setFireballs(this.fireballGroup);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1).setDeadzone(80, 40);
        this._setupPlayerCollisions();
        this.uiScene?.updateLives(this.lives);
        playMusic(this.levelData.music);
      });
    }
  }

  // ── Score / Coins ─────────────────────────────────────────────

  _addScore(amount, x, y) {
    const adj = Math.round(amount * this._coinScoreMult);
    this.score += adj;
    SaveSystem.set('score', this.score);
    if (this.score > (SaveSystem.get('highScore') || 0)) SaveSystem.set('highScore', this.score);
    this.uiScene?.updateScore(this.score);
    const txt = this.add.text(x, y - 8, `+${adj}`, {
      fontSize: '9px', fontFamily: FONT, color: '#ffd700',
      stroke: '#000', strokeThickness: 2,
    }).setDepth(20);
    this.tweens.add({ targets: txt, y: y - 28, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
  }

  _addCoins(amount) {
    this.coins += amount;
    SaveSystem.set('coins', this.coins);
    SaveSystem.incrementStat('totalCoinsEver', amount);
    SaveSystem.incrementStat('coinBank', amount); // feeds the skin-shop vault
    QuestSystem.trackStat('totalCoinsEver');
    this.uiScene?.updateCoins(this.coins);
    if (this.coins > 0 && this.coins % 100 === 0) {
      this.lives++;
      SFX.extra_life();
      this.uiScene?.updateLives(this.lives);
      this._showNotice('EXTRA LIFE! ❤');
    }
  }

  _updateCompletionPct() {
    const ep = this._totalEnemies > 0 ? this._killedEnemies / this._totalEnemies : 1;
    const cp = this._totalCoins   > 0 ? this._collectedCoins / this._totalCoins  : 1;
    this.uiScene?.updateCompletion(Math.round((ep + cp) / 2 * 100));
  }

  // ── Quick restart (R) — "one more try" without menus ─────────

  _quickRestart() {
    if (this._levelComplete || this._gamePaused || !this._introComplete) return;
    stopMusic();
    this.scene.stop(SCENES.UI);
    this.scene.restart(this._initData);
  }

  // ── Pause ─────────────────────────────────────────────────────

  _togglePause() {
    if (this._levelComplete || this.player?.isDead) return;
    this._gamePaused = !this._gamePaused;
    if (this._gamePaused) {
      this.physics.pause();
      SFX.pause();
      this.scene.launch(SCENES.PAUSE, {
        world: this.currentWorld, level: this.currentLevel,
        score: this.score, lives: this.lives,
      });
      this.scene.bringToTop(SCENES.PAUSE);
    } else {
      this.physics.resume();
      SFX.resume();
      this.scene.stop(SCENES.PAUSE);
    }
  }

  // ── Utility ──────────────────────────────────────────────────

  _flashScreen(color, duration, alpha = 0.2) {
    const { width, height } = this.scale;
    const fl = this.add.rectangle(width/2, height/2, width, height, color, alpha)
      .setScrollFactor(0).setDepth(400);
    this.tweens.add({ targets: fl, alpha: 0, duration, onComplete: () => fl.destroy() });
  }

  _showNotice(msg) {
    const { width } = this.scale;
    const txt = this.add.text(width / 2, 38, msg, {
      fontSize: '11px', fontFamily: FONT, color: '#ffd700',
      stroke: '#000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(200).setOrigin(0.5);
    this.tweens.add({
      targets: txt, y: 20, alpha: 0, duration: 1800, ease: 'Quad.easeIn',
      onComplete: () => txt.destroy(),
    });
  }

  // ── Update ────────────────────────────────────────────────────

  update(time, delta) {
    if (this._gamePaused || this._levelComplete || !this._introComplete) return;

    this._input.update();
    if (this._input.pauseJustDown) { this._togglePause(); return; }

    if (this._padIndicator) {
      this._padIndicator.setText(this.input.gamepad?.total > 0 ? '🎮' : '');
    }

    this.player.update(delta, this._input);

    // Coin magnet
    if (this.player.hasMagnet) {
      this.coinGroup.getChildren().forEach(coin => {
        if (!coin.collected) {
          const d = Phaser.Math.Distance.Between(coin.x, coin.y, this.player.x, this.player.y);
          if (d < MAGNET_RADIUS) coin.attractToPlayer(this.player);
        }
      });
    }

    // Boss update
    if (this.boss && !this.boss.isDead) {
      this.boss.update(delta, this.player);
    }

    this.enemyGroup.getChildren().forEach(e => {
      e.update?.(delta);
      if (e.active && e.y > this.levelData.height + 50) e.destroy();
    });
    this.powerUpGroup.getChildren().forEach(pu => pu.update?.());

    this.fireballGroup.getChildren().forEach(fb => {
      if (fb.active && (fb.x < 0 || fb.x > this.levelData.width || fb.y > this.levelData.height)) {
        fb.setActive(false).setVisible(false);
      }
    });

    // Moving platforms
    this.movingPlatforms.forEach(mp => {
      const cfg = mp.getData('mpConfig');
      const dir = mp.getData('mpDir');
      const start = mp.getData('mpStart');
      if (cfg.axis === 'x') {
        mp.body.setVelocityX(cfg.speed * dir);
        if (mp.x > start + cfg.range) { mp.setData('mpDir', -1); mp.body.setVelocityX(-cfg.speed); }
        if (mp.x < start - cfg.range) { mp.setData('mpDir',  1); mp.body.setVelocityX(cfg.speed); }
      } else {
        mp.body.setVelocityY(cfg.speed * dir);
        if (mp.y > start + cfg.range) { mp.setData('mpDir', -1); mp.body.setVelocityY(-cfg.speed); }
        if (mp.y < start - cfg.range) { mp.setData('mpDir',  1); mp.body.setVelocityY(cfg.speed); }
      }
    });

    // Animated tiles (lava/water shimmer)
    const frameDelta = delta / 1000;
    this._animatedTiles.forEach(at => {
      at.elapsed += frameDelta;
      if (at.elapsed >= 1 / at.rate) {
        at.elapsed = 0;
        at.idx = (at.idx + 1) % at.frames.length;
        at.sprite.setTexture(at.frames[at.idx]);
      }
    });

    // Countdown timer
    this.timeRemaining -= delta / 1000;
    if (this.timeRemaining <= 0 && !this.player.isDead) {
      this.timeRemaining = 0;
      this.player.die();
    }
    this.uiScene?.updateTime(Math.max(0, Math.ceil(this.timeRemaining)));

    // Live speedrun timer
    if (this._speedrunBest) {
      const el = (Date.now() - this._levelStartTime) / 1000;
      this.uiScene?.updateSpeedrunTimer(el, this._speedrunBest);
    }

    // Pit death
    if (this.player.y > this.levelData.height + 60 && !this.player.isDead) this.player.die();

    // Parallax
    this._parallax?.forEach(layer => layer.items.forEach(item => item.setScrollFactor(1 - layer.factor)));
  }
}
