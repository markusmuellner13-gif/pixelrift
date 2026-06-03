import { SCENES, TILE, GAME_W, GAME_H, COLORS, PLAYER_LIVES_START, COIN_SCORE, FLAGPOLE_BASE_SCORE, TIME_BONUS_FACTOR } from '../config.js';
import { playMusic, stopMusic, SFX, resumeMusic } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import QuestSystem from '../systems/QuestSystem.js';
import { getLevel } from '../levels/levelData.js';
import Player from '../objects/Player.js';
import Goomba from '../objects/Goomba.js';
import Koopa from '../objects/Koopa.js';
import Spiny from '../objects/Spiny.js';
import Coin from '../objects/Coin.js';
import PowerUp from '../objects/PowerUp.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.GAME }); }

  init(data) {
    this.currentWorld = data.world || 1;
    this.currentLevel = data.level || 1;
    this.lives   = data.lives   ?? (SaveSystem.get('lives') || PLAYER_LIVES_START);
    this.score   = data.score   ?? (SaveSystem.get('score') || 0);
    this.coins   = data.coins   ?? (SaveSystem.get('coins') || 0);
    this.elapsedTime  = 0;
    this._checkpointed = false;
    this._checkpointX = null;
    this._levelComplete = false;
    this._gamePaused = false;
    this._storedJumpChain = 0;
  }

  create() {
    const lvl = getLevel(this.currentWorld, this.currentLevel);
    if (!lvl) { this.scene.start(SCENES.WORLDMAP); return; }
    this.levelData = lvl;
    this.levelWidth = lvl.width;

    // Background
    this._buildBackground(lvl);

    // Physics world bounds
    this.physics.world.setBounds(0, 0, lvl.width, lvl.height + 100);

    // Static groups
    this.groundGroup  = this.physics.add.staticGroup();
    this.platformGroup= this.physics.add.staticGroup();
    this.brickGroup   = this.physics.add.staticGroup();
    this.questionGroup= this.physics.add.staticGroup();
    this.spikeGroup   = this.physics.add.staticGroup();
    this.pipeGroup    = this.physics.add.staticGroup();

    // Dynamic groups
    this.enemyGroup   = this.physics.add.group({ collideWorldBounds: false });
    this.coinGroup    = this.physics.add.group();
    this.powerUpGroup = this.physics.add.group();
    this.fireballGroup= this.physics.add.group({ allowGravity: true, bounceY: 0.6 });

    // Moving platforms (manual)
    this.movingPlatforms = [];

    this._buildLevel(lvl);
    this._buildFlagpole(lvl);
    if (lvl.checkpoint) this._buildCheckpoint(lvl);

    // Player
    const px = lvl.start.x;
    const py = lvl.start.y;
    this.player = new Player(this, px, py);
    this.player.setFireballs(this.fireballGroup);

    // Particle emitters
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
      .setBounds(0, 0, lvl.width, lvl.height + 100)
      .startFollow(this.player, true, 0.1, 0.1)
      .setDeadzone(80, 40);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.runKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.pauseKey= this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.pauseKey.on('down', () => this._togglePause());

    // Touch controls
    this._buildTouchControls();

    // Collisions
    this._setupCollisions();

    // Events
    this.events.on('scoreAdd', this._addScore, this);
    this.events.on('collectCoin', this._addCoins, this);
    this.events.on('playerDied', this._onPlayerDied, this);
    this.events.on('starStart', () => playMusic('starmode'));
    this.events.on('starEnd', () => playMusic(this.levelData.music));

    // UI scene
    this.scene.launch(SCENES.UI, {
      world: this.currentWorld, level: this.currentLevel,
      lives: this.lives, score: this.score, coins: this.coins,
      timeLimit: lvl.timeLimit,
    });
    this.uiScene = this.scene.get(SCENES.UI);

    playMusic(lvl.music);

    // Time limit
    this.timeRemaining = lvl.timeLimit;
  }

  _buildBackground(lvl) {
    const w = lvl.width;
    const h = lvl.height;

    // Sky
    this.add.rectangle(w / 2, h / 2, w, h, lvl.bgColor).setDepth(-10);

    // Parallax layers (scrolled manually in update)
    this._parallax = [];

    if (lvl.theme !== 'cave') {
      // Mountains (slowest)
      const mtnCount = Math.ceil(w / 60) + 2;
      const mtns = [];
      for (let i = 0; i < mtnCount; i++) {
        const m = this.add.image(i * 60 + 30, h - 60, 'mountain')
          .setDepth(-9).setAlpha(0.6);
        mtns.push(m);
      }
      this._parallax.push({ items: mtns, factor: 0.3, spacing: 60 });

      // Clouds (mid speed)
      const clouds = [];
      for (let i = 0; i < 12; i++) {
        const cx = Phaser.Math.Between(0, w);
        const cy = Phaser.Math.Between(20, 80);
        const c = this.add.image(cx, cy, Math.random() > 0.5 ? 'cloud_big' : 'cloud_small')
          .setDepth(-8).setAlpha(0.9);
        clouds.push(c);
      }
      this._parallax.push({ items: clouds, factor: 0.15, spacing: null });
    }
  }

  _buildLevel(lvl) {
    const T = TILE;
    const groundY = lvl.height - T; // bottom row of tiles

    // Determine tile textures based on theme
    const groundTopTex = lvl.theme === 'desert' ? 'tile_sand_top' :
                         lvl.theme === 'snow' || lvl.theme === 'cave' ? 'tile_snow_top' : 'tile_ground_top';
    const groundTex    = lvl.theme === 'desert' ? 'tile_sand' :
                         lvl.theme === 'snow' || lvl.theme === 'cave' ? 'tile_snow' : 'tile_ground';

    // Ground segments
    for (const seg of lvl.grounds) {
      for (let gx = seg.x; gx < seg.x + seg.w; gx++) {
        // Top row
        const tile = this.groundGroup.create(gx * T + T / 2, groundY - T + T / 2, groundTopTex);
        tile.body.setSize(T, T);
        tile.refreshBody();
        // Fill below
        for (let dy = 1; dy <= 3; dy++) {
          const bt = this.groundGroup.create(gx * T + T / 2, groundY - T + dy * T + T / 2, groundTex);
          bt.body.setSize(T, T);
          bt.refreshBody();
        }
      }
    }

    // Floating platforms
    for (const plat of lvl.platforms) {
      for (let px = plat.x; px < plat.x + plat.w; px++) {
        const tile = this.platformGroup.create(px * T + T / 2, plat.y * T + T / 2, groundTopTex);
        tile.body.setSize(T, T);
        tile.refreshBody();
      }
    }

    // Question blocks
    this._questionStates = {};
    for (const q of lvl.questions) {
      const key = `${q.x},${q.y}`;
      this._questionStates[key] = { used: false, item: q.item };
      const block = this.questionGroup.create(q.x * T + T / 2, q.y * T + T / 2, 'tile_question0');
      block.setData('qkey', key);
      block.body.setSize(T, T);
      block.refreshBody();
      // Animate question block
      this.anims.exists('question_anim') || this.anims.create({
        key: 'question_anim',
        frames: [{ key: 'tile_question0' }, { key: 'tile_question1' }],
        frameRate: 3, repeat: -1,
      });
      block.play('question_anim');
    }

    // Brick blocks
    for (const br of lvl.bricks) {
      const brick = this.brickGroup.create(br.x * T + T / 2, br.y * T + T / 2, 'tile_brick');
      brick.body.setSize(T, T);
      brick.refreshBody();
    }

    // Pipes
    for (const pipe of (lvl.pipes || [])) {
      for (let ph = 0; ph < pipe.h; ph++) {
        const py2 = (lvl.height / T - 1 - ph) * T + T / 2;
        const leftKey  = ph === pipe.h - 1 ? 'tile_pipe_top_l' : 'tile_pipe_l';
        const rightKey = ph === pipe.h - 1 ? 'tile_pipe_top_r' : 'tile_pipe_r';
        const pl = this.pipeGroup.create(pipe.x * T + T / 2, py2, leftKey);
        const pr = this.pipeGroup.create((pipe.x + 1) * T + T / 2, py2, rightKey);
        pl.body.setSize(T, T); pl.refreshBody();
        pr.body.setSize(T, T); pr.refreshBody();
      }
    }

    // Coins
    for (const [cx, cy] of (lvl.coins || [])) {
      const coin = new Coin(this, cx * T + T / 2, cy * T + T / 2);
      this.coinGroup.add(coin);
    }

    // Enemies
    for (const en of (lvl.enemies || [])) {
      let enemy;
      if (en.type === 'goomba') enemy = new Goomba(this, en.x, en.y);
      else if (en.type === 'koopa') enemy = new Koopa(this, en.x, en.y);
      else if (en.type === 'spiny') enemy = new Spiny(this, en.x, en.y);
      if (enemy) this.enemyGroup.add(enemy);
    }

    // Spikes
    for (const sp of (lvl.spikes || [])) {
      const spike = this.spikeGroup.create(sp.x, sp.y, 'spike');
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
  }

  _buildFlagpole(lvl) {
    const T = TILE;
    const fx = lvl.flagpole.x;
    const fy = lvl.height - 100;
    this.flagpole = this.add.image(fx, fy, 'flagpole').setOrigin(0.5, 1).setDepth(3);
    // Flag trigger zone
    this.flagTrigger = this.add.zone(fx, fy, 16, 96).setOrigin(0.5, 1);
    this.physics.add.existing(this.flagTrigger, true);
  }

  _buildCheckpoint(lvl) {
    const T = TILE;
    const cx = lvl.checkpoint.x;
    const cy = lvl.height - T * 2;
    this.checkpointSprite = this.add.image(cx, cy, 'checkpoint').setDepth(3);
    this.checkpointZone   = this.add.zone(cx, cy, 12, 32);
    this.physics.add.existing(this.checkpointZone, true);
  }

  _setupCollisions() {
    const p = this.player;
    const colGroups = [this.groundGroup, this.platformGroup, this.brickGroup, this.questionGroup, this.pipeGroup];

    // Player vs static world
    colGroups.forEach(g => {
      this.physics.add.collider(p, g);
    });

    // Player vs moving platforms
    this.movingPlatforms.forEach(mp => {
      this.physics.add.collider(p, mp);
    });

    // Player head-bump question blocks
    this.physics.add.collider(p, this.questionGroup, this._hitQuestion, null, this);
    this.physics.add.collider(p, this.brickGroup, this._hitBrick, null, this);

    // Enemies vs world
    const enemyWorldGroups = [this.groundGroup, this.platformGroup, this.pipeGroup];
    this.enemyGroup.getChildren().forEach(e => {
      enemyWorldGroups.forEach(g => this.physics.add.collider(e, g));
    });

    // Player vs coins
    this.physics.add.overlap(p, this.coinGroup, (player, coin) => {
      if (coin.collect) coin.collect();
    });

    // Player vs power-ups
    this.physics.add.overlap(p, this.powerUpGroup, (player, pu) => {
      if (pu.collect) pu.collect(player);
    });

    // Player vs enemies
    this.physics.add.overlap(p, this.enemyGroup, this._handlePlayerEnemyContact, null, this);

    // Fireballs vs enemies
    this.physics.add.overlap(this.fireballGroup, this.enemyGroup, this._handleFireballEnemy, null, this);
    // Fireballs vs world
    colGroups.forEach(g => {
      this.physics.add.collider(this.fireballGroup, g, (fb) => {
        // Fireball bounces on ground, dies on walls
        if (fb.body.blocked.left || fb.body.blocked.right) {
          fb.setActive(false).setVisible(false).body.reset(-100, -100);
        }
      });
    });

    // Player vs spikes
    this.physics.add.overlap(p, this.spikeGroup, () => p.takeDamage());

    // Checkpoint
    if (this.checkpointZone) {
      this.physics.add.overlap(p, this.checkpointZone, this._hitCheckpoint, null, this);
    }

    // Flagpole
    this.physics.add.overlap(p, this.flagTrigger, this._hitFlagpole, null, this);

    // Enemy vs enemy (turn around)
    this.physics.add.collider(this.enemyGroup, this.enemyGroup, (a, b) => {
      if (a.body.velocity.x > 0) { a.body.setVelocityX(-Math.abs(a.body.velocity.x)); }
      else { a.body.setVelocityX(Math.abs(a.body.velocity.x)); }
    });

    // Koopa shells vs enemies
    this.physics.add.overlap(this.enemyGroup, this.enemyGroup, (a, b) => {
      if (a instanceof Koopa && a.isShell && a.shellMoving && !b.isDead) {
        b.hitByStar && b.hitByStar(1);
      }
      if (b instanceof Koopa && b.isShell && b.shellMoving && !a.isDead) {
        a.hitByStar && a.hitByStar(1);
      }
    });
  }

  _hitQuestion(player, block) {
    // Only trigger when player hits from below
    if (player.body.velocity.y >= 0) return;
    const key = block.getData('qkey');
    if (!key) return;
    const state = this._questionStates[key];
    if (!state || state.used) return;
    state.used = true;
    block.stop().setTexture('tile_used');
    block.body.reset(block.x, block.y);

    // Bump animation
    this.tweens.add({
      targets: block,
      y: block.y - 4, duration: 80, yoyo: true,
    });

    // Spawn item
    if (state.item === 'coin') {
      new Coin(this, block.x, block.y - TILE, true);
      SFX.coin();
    } else {
      const pu = new PowerUp(this, block.x, block.y - TILE, state.item);
      this.powerUpGroup.add(pu);
      // Collide powerup with world
      [this.groundGroup, this.platformGroup].forEach(g =>
        this.physics.add.collider(pu, g)
      );
    }
    SFX.break();
  }

  _hitBrick(player, brick) {
    if (player.body.velocity.y >= 0) return;
    if (player.state === 'small') {
      // Bump but don't break
      this.tweens.add({ targets: brick, y: brick.y - 4, duration: 80, yoyo: true });
      SFX.break();
      return;
    }
    // Big/Fire: break brick
    SFX.break();
    this.cameras.main.shake(60, 0.005);
    this.events.emit('scoreAdd', 50, brick.x, brick.y);
    this.brickGroup.remove(brick, true, true);
    // Brick particle
    this.coinEmitter.emitParticleAt(brick.x, brick.y, 4);
  }

  _handlePlayerEnemyContact(player, enemy) {
    if (player.isDead || enemy.isDead) return;

    // Star mode — kill everything
    if (player.hasStar) {
      enemy.hitByStar && enemy.hitByStar(this._storedJumpChain);
      this._storedJumpChain++;
      return;
    }

    // Stomp — player falling onto enemy
    if (player.body.velocity.y > 0 && player.y < enemy.y - 4) {
      if (enemy instanceof Spiny) {
        enemy.stomp(player);
      } else {
        enemy.stomp(player, this._storedJumpChain);
        this._storedJumpChain++;
        this.time.delayedCall(200, () => { this._storedJumpChain = 0; });
      }
      return;
    }

    // Side contact — damage player
    player.takeDamage();
    this._storedJumpChain = 0;
  }

  _handleFireballEnemy(fireball, enemy) {
    if (enemy.isDead) return;
    fireball.setActive(false).setVisible(false).body.reset(-100, -100);
    if (enemy instanceof Spiny) {
      enemy.hitByFireball && enemy.hitByFireball();
    } else {
      enemy.hitByStar && enemy.hitByStar(0);
    }
    SFX.stomp();
  }

  _hitCheckpoint(player, zone) {
    if (this._checkpointed) return;
    this._checkpointed = true;
    this._checkpointX = player.x;
    SFX.checkpoint();
    // Animate checkpoint flag
    if (this.checkpointSprite) {
      this.tweens.add({ targets: this.checkpointSprite, tint: 0x00ff00, duration: 300 });
    }
    this.events.emit('scoreAdd', 500, player.x, player.y);
  }

  _hitFlagpole(player, zone) {
    if (this._levelComplete || player.isDead) return;
    this._levelComplete = true;
    stopMusic();
    SFX.flagpole();

    // Score bonus based on height player hits flag
    const heightBonus = Math.max(0, Math.floor((this.levelData.height - player.y) * 2));
    const timeBonus   = Math.floor(this.timeRemaining) * TIME_BONUS_FACTOR;
    const totalBonus  = FLAGPOLE_BASE_SCORE + heightBonus + timeBonus;
    this.score += totalBonus;

    // Slide player down flagpole
    player.body.setVelocity(0, 0);
    player.body.setAllowGravity(false);
    const flagX = zone.x + 16;
    this.tweens.add({
      targets: player, x: flagX,
      duration: 200, ease: 'Linear',
      onComplete: () => {
        this.tweens.add({
          targets: player, y: this.levelData.height - 32,
          duration: 600, ease: 'Linear',
          onComplete: () => {
            this._completeLevel(timeBonus, heightBonus);
          }
        });
      }
    });

    // Coins fly
    this.coinEmitter.emitParticleAt(zone.x, zone.y, 10);
  }

  _completeLevel(timeBonus, heightBonus) {
    SFX.levelwin();
    // Stars: 3 = fast + no damage, 2 = complete, 1 = any
    let stars = 1;
    if (!this.player.damageTakenThisLevel) stars = 2;
    if (!this.player.damageTakenThisLevel && this.timeRemaining > this.levelData.timeLimit * 0.5) stars = 3;

    // Quest tracking
    QuestSystem.onLevelComplete(
      this.currentWorld, this.currentLevel,
      this.levelData.timeLimit - this.timeRemaining,
      this.player.damageTakenThisLevel,
      this.player.hasMaxCombo4
    );

    // Save progress
    SaveSystem.setLevel(this.currentWorld, this.currentLevel, {
      completed: true,
      stars,
      bestTime: this.levelData.timeLimit - this.timeRemaining,
    });
    SaveSystem.set('score', this.score);
    SaveSystem.set('coins', this.coins);
    SaveSystem.set('lives', this.lives);
    SaveSystem.addHighScore('NOVA', this.score);
    SaveSystem.incrementStat('totalPlayTime', Math.floor(this.levelData.timeLimit - this.timeRemaining));
    SaveSystem.save();

    // Stop enemy colliders
    this._levelComplete = true;

    this.time.delayedCall(1500, () => {
      this.scene.stop(SCENES.UI);
      this.scene.start(SCENES.LVLCOMPLETE, {
        world: this.currentWorld, level: this.currentLevel,
        score: this.score, coins: this.coins, lives: this.lives,
        stars, timeBonus, heightBonus,
      });
    });
  }

  _onPlayerDied() {
    this.lives--;
    SaveSystem.set('lives', this.lives);
    SaveSystem.save();

    if (this.lives <= 0) {
      this.scene.stop(SCENES.UI);
      stopMusic();
      this.time.delayedCall(500, () => {
        this.scene.start(SCENES.GAMEOVER, {
          world: this.currentWorld, level: this.currentLevel,
          score: this.score,
        });
      });
    } else {
      // Respawn
      this.time.delayedCall(1200, () => {
        const rx = this._checkpointed ? this._checkpointX : this.levelData.start.x;
        const ry = this.levelData.start.y;
        this.player.destroy();
        this.player = new Player(this, rx, ry);
        this.player.setFireballs(this.fireballGroup);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1).setDeadzone(80, 40);
        this._setupPlayerCollisions();
        this.uiScene?.updateLives(this.lives);
        playMusic(this.levelData.music);
      });
    }
  }

  _setupPlayerCollisions() {
    const p = this.player;
    const colGroups = [this.groundGroup, this.platformGroup, this.brickGroup, this.questionGroup, this.pipeGroup];
    colGroups.forEach(g => this.physics.add.collider(p, g));
    this.movingPlatforms.forEach(mp => this.physics.add.collider(p, mp));
    this.physics.add.collider(p, this.questionGroup, this._hitQuestion, null, this);
    this.physics.add.collider(p, this.brickGroup, this._hitBrick, null, this);
    this.physics.add.overlap(p, this.coinGroup, (player, coin) => { if (coin.collect) coin.collect(); });
    this.physics.add.overlap(p, this.powerUpGroup, (player, pu) => { if (pu.collect) pu.collect(player); });
    this.physics.add.overlap(p, this.enemyGroup, this._handlePlayerEnemyContact, null, this);
    this.physics.add.overlap(p, this.spikeGroup, () => p.takeDamage());
    if (this.checkpointZone) this.physics.add.overlap(p, this.checkpointZone, this._hitCheckpoint, null, this);
    this.physics.add.overlap(p, this.flagTrigger, this._hitFlagpole, null, this);
  }

  _addScore(amount, x, y) {
    this.score += amount;
    SaveSystem.set('score', this.score);
    if (this.score > (SaveSystem.get('highScore') || 0)) {
      SaveSystem.set('highScore', this.score);
    }
    this.uiScene?.updateScore(this.score);

    // Floating score text
    const txt = this.add.text(x, y - 8, `+${amount}`, {
      fontSize: '7px', fontFamily: 'monospace', color: '#ffd700',
      stroke: '#000', strokeThickness: 1,
    }).setDepth(20);
    this.tweens.add({ targets: txt, y: y - 28, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
  }

  _addCoins(amount) {
    this.coins += amount;
    SaveSystem.set('coins', this.coins);
    SaveSystem.incrementStat('totalCoinsEver', amount);
    QuestSystem.trackStat('totalCoinsEver');
    this.uiScene?.updateCoins(this.coins);
    if (this.coins % 100 === 0) {
      // Extra life every 100 coins
      this.lives++;
      SFX.extra_life();
      this.uiScene?.updateLives(this.lives);
    }
  }

  _togglePause() {
    if (this._levelComplete || this.player.isDead) return;
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

  _buildTouchControls() {
    const { width, height } = this.scale;
    const btnStyle = { fillColor: 0xffffff, fillAlpha: 0.15, strokeColor: 0xffffff, strokeAlpha: 0.4 };

    // Left button
    const leftBtn = this.add.circle(30, height - 30, 22, 0xffffff, 0.12)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(30, height - 30, '◀', { fontSize: '14px', color: '#ffffff', alpha: 0.6 })
      .setScrollFactor(0).setDepth(101).setOrigin(0.5);

    // Right button
    const rightBtn = this.add.circle(80, height - 30, 22, 0xffffff, 0.12)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(80, height - 30, '▶', { fontSize: '14px', color: '#ffffff', alpha: 0.6 })
      .setScrollFactor(0).setDepth(101).setOrigin(0.5);

    // Jump button
    const jumpBtn = this.add.circle(width - 30, height - 30, 26, 0x5599ff, 0.2)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(width - 30, height - 30, '▲', { fontSize: '14px', color: '#aaddff', alpha: 0.7 })
      .setScrollFactor(0).setDepth(101).setOrigin(0.5);

    // Run button
    const runBtn = this.add.circle(width - 75, height - 28, 18, 0xff9900, 0.2)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(width - 75, height - 28, 'Z', { fontSize: '10px', color: '#ffcc55', alpha: 0.7 })
      .setScrollFactor(0).setDepth(101).setOrigin(0.5);

    // Fire button
    const fireBtn = this.add.circle(width - 115, height - 28, 18, 0xff4400, 0.2)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(width - 115, height - 28, 'X', { fontSize: '10px', color: '#ff8844', alpha: 0.7 })
      .setScrollFactor(0).setDepth(101).setOrigin(0.5);

    // Virtual input state
    this._touchLeft  = false;
    this._touchRight = false;
    this._touchJump  = false;
    this._touchRun   = false;
    this._touchFire  = false;

    const bind = (btn, flag) => {
      btn.on('pointerdown', () => { this[flag] = true; });
      btn.on('pointerup', () => { this[flag] = false; });
      btn.on('pointerout', () => { this[flag] = false; });
    };
    bind(leftBtn,  '_touchLeft');
    bind(rightBtn, '_touchRight');
    bind(runBtn,   '_touchRun');
    bind(fireBtn,  '_touchFire');

    jumpBtn.on('pointerdown', () => {
      this._touchJump = true;
      // simulate JustDown by forcing cursors.up
      this._touchJumpJustDown = true;
    });
    jumpBtn.on('pointerup',  () => { this._touchJump = false; this._touchJumpJustDown = false; });
    jumpBtn.on('pointerout', () => { this._touchJump = false; this._touchJumpJustDown = false; });

    // Pause
    const pauseBtn = this.add.text(width / 2, 10, '⏸', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff', alpha: 0.6
    }).setScrollFactor(0).setDepth(100).setOrigin(0.5).setInteractive();
    pauseBtn.on('pointerdown', () => this._togglePause());
  }

  update(time, delta) {
    if (this._gamePaused || this._levelComplete) return;

    // Merge touch input into cursors
    if (this._touchLeft)  this.cursors.left.isDown  = true;
    else if (!this.input.keyboard.keys[37]?.isDown) this.cursors.left.isDown = false;
    if (this._touchRight) this.cursors.right.isDown = true;
    else if (!this.input.keyboard.keys[39]?.isDown) this.cursors.right.isDown = false;
    if (this._touchRun && this.runKey) this.runKey.isDown = true;
    if (this._touchJumpJustDown) {
      this.cursors.up._justDown = true;
      this.cursors.space._justDown = true;
      this._touchJumpJustDown = false;
    }

    this.player.update(delta, this.cursors, this.runKey, this.fireKey);

    // Enemy updates
    this.enemyGroup.getChildren().forEach(e => {
      if (e.update) e.update(delta);
      if (e.active && e.y > this.levelData.height + 50) e.destroy();
    });

    // PowerUp updates
    this.powerUpGroup.getChildren().forEach(pu => pu.update?.());

    // Fireball cleanup
    this.fireballGroup.getChildren().forEach(fb => {
      if (fb.active && (fb.x < 0 || fb.x > this.levelData.width || fb.y > this.levelData.height)) {
        fb.setActive(false).setVisible(false);
      }
    });

    // Moving platforms
    this.movingPlatforms.forEach(mp => {
      const cfg = mp.getData('mpConfig');
      let dir = mp.getData('mpDir');
      const start = mp.getData('mpStart');
      const speed = cfg.speed;
      const range = cfg.range;

      if (cfg.axis === 'x') {
        mp.body.setVelocityX(speed * dir);
        if (mp.x > start + range) { mp.setData('mpDir', -1); mp.body.setVelocityX(-speed); }
        if (mp.x < start - range) { mp.setData('mpDir', 1);  mp.body.setVelocityX(speed); }
      } else {
        mp.body.setVelocityY(speed * dir);
        if (mp.y > start + range) { mp.setData('mpDir', -1); mp.body.setVelocityY(-speed); }
        if (mp.y < start - range) { mp.setData('mpDir', 1);  mp.body.setVelocityY(speed); }
      }
    });

    // Timer
    this.timeRemaining -= delta / 1000;
    if (this.timeRemaining <= 0 && !this.player.isDead) {
      this.timeRemaining = 0;
      this.player.die();
    }
    this.uiScene?.updateTime(Math.max(0, Math.ceil(this.timeRemaining)));

    // Pit death
    if (this.player.y > this.levelData.height + 60 && !this.player.isDead) {
      this.player.die();
    }

    // Parallax scroll
    if (this._parallax) {
      const camX = this.cameras.main.scrollX;
      this._parallax.forEach(layer => {
        layer.items.forEach(item => {
          item.setScrollFactor(1 - layer.factor);
        });
      });
    }
  }
}
