import { BOSS_HP, BOSS_SHOOT_INTERVAL_BASE, BOSS_PROJ_SPEED } from '../config.js';
import { SFX } from '../systems/AudioSystem.js';

const BOSS_CONFIG = {
  goomboss:  { tex: 'boss_goomboss', w: 24, h: 24, speed: 60,  projTex: 'boss_proj',      projCount: 1, arenaW: 200, label: 'GOOMBOSS'   },
  sphinx:    { tex: 'boss_sphinx',   w: 28, h: 20, speed: 80,  projTex: 'boss_proj',      projCount: 2, arenaW: 220, label: 'DESERT SPHINX', flies: true },
  frostgiant:{ tex: 'boss_frostgiant',w:24, h: 28, speed: 70,  projTex: 'boss_proj',      projCount: 2, arenaW: 200, label: 'FROST GIANT' },
  voidlord:  { tex: 'boss_voidlord', w: 32, h: 32, speed: 100, projTex: 'boss_proj_void', projCount: 3, arenaW: 240, label: 'VOID LORD',   teleports: true },
};

export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    const cfg = BOSS_CONFIG[type] || BOSS_CONFIG.goomboss;
    super(scene, x, y, cfg.tex);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.bossType = type;
    this.cfg = cfg;
    this.hp = BOSS_HP;
    this.maxHp = BOSS_HP;
    this.phase = 0;
    this.isDead = false;
    this.stunned = false;
    this.stunTimer = 0;

    this._shootTimer = BOSS_SHOOT_INTERVAL_BASE;
    this._moveDir = 1;
    this._arenaLeft = x - cfg.arenaW / 2;
    this._arenaRight = x + cfg.arenaW / 2;
    this._baseY = y;
    this._bounceTimer = 0;
    this._teleportTimer = 4000;

    this.body.setSize(cfg.w, cfg.h);
    this.body.setCollideWorldBounds(false);
    this.body.setGravityY(cfg.flies ? -900 : 0); // cancel gravity for flyers

    this.setScale(2);
    this.setDepth(8);

    // HP bar
    this._buildHPBar(scene);

    // Phase label
    this._label = scene.add.text(x, y - 30, cfg.label, {
      fontSize: '8px', fontFamily: 'monospace', color: '#ff4444',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9);

    // Projectile pool
    this.projectiles = scene.physics.add.group({ allowGravity: false });

    // Intro shake
    scene.cameras.main.shake(300, 0.015);
    this._showIntroText(scene);
  }

  _buildHPBar(scene) {
    const { width } = scene.scale;
    this._hpBarBg = scene.add.rectangle(width / 2, 22, 90, 10, 0x330000)
      .setScrollFactor(0).setDepth(200);
    this._hpBarFill = scene.add.rectangle(width / 2 - 44, 22, 88, 8, 0xff2222)
      .setScrollFactor(0).setDepth(201).setOrigin(0, 0.5);
    this._hpLabel = scene.add.text(width / 2, 14, `⚠ ${this.cfg.label}`, {
      fontSize: '7px', fontFamily: 'monospace', color: '#ff6666',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
  }

  _showIntroText(scene) {
    const { width, height } = scene.scale;
    const txt = scene.add.text(width / 2, height / 2, `⚠ ${this.cfg.label} APPEARS!`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff4444',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);
    scene.tweens.add({
      targets: txt, alpha: 1, y: height / 2 - 10,
      duration: 400, ease: 'Back.easeOut',
      onComplete: () => {
        scene.time.delayedCall(1200, () => {
          scene.tweens.add({ targets: txt, alpha: 0, duration: 300, onComplete: () => txt.destroy() });
        });
      },
    });
  }

  update(delta, player) {
    if (this.isDead || !player) return;

    // Update label position
    if (this._label) {
      this._label.x = this.x;
      this._label.y = this.y - 40;
    }

    // Stun flash
    if (this.stunned) {
      this.stunTimer -= delta;
      this.setAlpha(Math.floor(this.stunTimer / 60) % 2 === 0 ? 0.5 : 1);
      if (this.stunTimer <= 0) {
        this.stunned = false;
        this.setAlpha(1);
        this.clearTint();
      }
      return;
    }

    const spd = this.cfg.speed * (1 + this.phase * 0.4);

    // Void Lord teleports
    if (this.cfg.teleports) {
      this._teleportTimer -= delta;
      if (this._teleportTimer <= 0) {
        this._teleportTimer = 2500 - this.phase * 500;
        this._doTeleport(player);
        return;
      }
    }

    // Movement
    this.body.setVelocityX(spd * this._moveDir);

    // Turn around at arena edges
    if (this.x <= this._arenaLeft)  { this._moveDir = 1;  this.setFlipX(false); }
    if (this.x >= this._arenaRight) { this._moveDir = -1; this.setFlipX(true);  }

    // Flying: sinusoidal Y
    if (this.cfg.flies) {
      this._bounceTimer += delta;
      const targetY = this._baseY + Math.sin(this._bounceTimer / 500) * 40;
      this.body.setVelocityY((targetY - this.y) * 5);
    }

    // Shooting
    this._shootTimer -= delta;
    const shootInterval = BOSS_SHOOT_INTERVAL_BASE * (1 - this.phase * 0.25);
    if (this._shootTimer <= 0) {
      this._shootTimer = Math.max(700, shootInterval);
      this._shoot(player);
    }

    // Update HP bar
    this._updateHPBar();
  }

  _doTeleport(player) {
    // Teleport to a random position away from player
    const cx = player.x < this.x
      ? this._arenaLeft + 60 + Math.random() * 60
      : this._arenaRight - 60 - Math.random() * 60;

    this.scene.tweens.add({
      targets: this, alpha: 0, duration: 150,
      onComplete: () => {
        this.x = cx;
        this.y = this._baseY + (Math.random() - 0.5) * 30;
        this.scene.tweens.add({ targets: this, alpha: 1, duration: 150 });
      },
    });
  }

  _shoot(player) {
    const count = this.cfg.projCount + this.phase;
    SFX.boss_shoot();
    for (let i = 0; i < count; i++) {
      const spread = count === 1 ? 0 : (i - (count - 1) / 2) * 0.4;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = BOSS_PROJ_SPEED + this.phase * 30;
      const proj = this.projectiles.get(this.x, this.y, this.cfg.projTex);
      if (!proj) continue;
      proj.setActive(true).setVisible(true).setDepth(7);
      proj.body.setVelocity(
        (dx / len + spread) * speed,
        (dy / len + Math.abs(spread) * 0.5) * speed
      );
      proj.body.setAllowGravity(false);
      proj.body.setSize(8, 8);
      // Auto-destroy far projectiles
      this.scene.time.delayedCall(4000, () => {
        if (proj.active) proj.setActive(false).setVisible(false);
      });
    }
  }

  _updateHPBar() {
    if (!this._hpBarFill) return;
    const pct = Math.max(0, this.hp / this.maxHp);
    this._hpBarFill.width = pct * 88;
    const color = pct > 0.6 ? 0xff2222 : pct > 0.3 ? 0xff8800 : 0xffff00;
    this._hpBarFill.fillColor = color;
  }

  hit() {
    if (this.isDead || this.stunned) return;
    this.hp--;
    SFX.boss_hit();
    this.scene.cameras.main.shake(200, 0.018);

    // Flash white
    this.setTint(0xffffff);
    this.stunned = true;
    this.stunTimer = 600;
    this.body.setVelocity(0, 0);
    this.phase = this.maxHp - this.hp;

    if (this.hp <= 0) {
      this._die();
    } else {
      // Phase change: faster, more aggressive
      this.scene.cameras.main.flash(100, 255, 100, 100);
      this._showPhaseText();
    }
    this._updateHPBar();
  }

  _showPhaseText() {
    const msgs = ['ENRAGED!', 'BERSERK!'];
    const msg = msgs[Math.min(this.phase - 1, msgs.length - 1)];
    const { width, height } = this.scene.scale;
    const txt = this.scene.add.text(width / 2, height / 2 - 20, `⚠ ${msg}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff8800',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);
    this.scene.tweens.add({
      targets: txt, alpha: 1, duration: 200,
      onComplete: () => {
        this.scene.time.delayedCall(1000, () => {
          this.scene.tweens.add({ targets: txt, alpha: 0, duration: 300, onComplete: () => txt.destroy() });
        });
      }
    });
  }

  _die() {
    this.isDead = true;
    SFX.boss_die();
    this.scene.cameras.main.shake(500, 0.025);
    this.scene.cameras.main.flash(300, 255, 200, 0);

    // Explosion sequence
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 120, () => {
        const ex = this.x + (Math.random() - 0.5) * 60;
        const ey = this.y + (Math.random() - 0.5) * 60;
        const e = this.scene.add.image(ex, ey, 'explosion_0').setDepth(15).setScale(2);
        this.scene.tweens.add({ targets: e, alpha: 0, scale: 3, duration: 300, onComplete: () => e.destroy() });
      });
    }

    this.scene.tweens.add({
      targets: this, alpha: 0, scaleX: 3, scaleY: 3,
      duration: 600, ease: 'Quad.easeOut',
      onComplete: () => {
        // Clean up HP bar
        this._hpBarBg?.destroy();
        this._hpBarFill?.destroy();
        this._hpLabel?.destroy();
        this._label?.destroy();
        this.projectiles.clear(true, true);
        this.destroy();
        this.scene.events.emit('bossDefeated');
      },
    });
  }

  // Called from GameScene when player jumps on boss
  stompBoss(player) {
    if (this.isDead || this.stunned) return;
    player.stompBounce();
    this.hit();
  }

  // Called from GameScene when fireball hits boss
  fireballHit() {
    if (this.isDead || this.stunned) return;
    this.hit();
  }
}
