import { COYOTE_TIME, JUMP_BUFFER_TIME, PLAYER_SPEED, PLAYER_RUN_SPEED, PLAYER_JUMP_VEL, INVINCIBILITY_DURATION, STAR_DURATION } from '../config.js';
import { SFX } from '../systems/AudioSystem.js';
import QuestSystem from '../systems/QuestSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export const PLAYER_STATE = { SMALL: 'small', BIG: 'big', FIRE: 'fire' };

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'nova_small_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.state = PLAYER_STATE.SMALL;
    this.isInvincible = false;
    this.hasStar = false;
    this.isDead = false;
    this.isGrounded = false;
    this.facingRight = true;
    this.wasOnGround = false;

    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.invincTimer = 0;
    this.starTimer = 0;
    this.stomboCombo = 0;
    this.damageTakenThisLevel = false;
    this.hasMaxCombo4 = false;

    this.fireballCooldown = 0;
    this.fireballs = null;

    this._setupBody();
    this._setupAnimations();
    this.setDepth(10);
  }

  _setupBody() {
    this.body.setMaxVelocityY(600);
    this.body.setGravityY(0);
    this._setColliderForState();
  }

  _setColliderForState() {
    if (this.state === PLAYER_STATE.SMALL) {
      this.body.setSize(10, 13);
      this.body.setOffset(1, 0);
    } else {
      this.body.setSize(10, 16);
      this.body.setOffset(1, 0);
    }
  }

  _setupAnimations() {
    const anims = this.scene.anims;
    const safe = (key, frames, fr, repeat) => {
      if (!anims.exists(key)) {
        anims.create({ key, frames: frames.map(f => ({ key: f })), frameRate: fr, repeat });
      }
    };
    safe('nova_small_walk', ['nova_small_walk0', 'nova_small_walk1'], 8, -1);
    safe('nova_small_idle', ['nova_small_idle'], 1, -1);
    safe('nova_small_jump', ['nova_small_jump'], 1, -1);
    safe('nova_big_walk',   ['nova_big_idle', 'nova_big_idle'], 8, -1);
    safe('nova_big_idle',   ['nova_big_idle'], 1, -1);
    safe('nova_big_jump',   ['nova_big_jump'], 1, -1);
    safe('nova_fire_walk',  ['nova_fire_idle', 'nova_fire_idle'], 8, -1);
    safe('nova_fire_idle',  ['nova_fire_idle'], 1, -1);
    safe('nova_fire_jump',  ['nova_big_jump'], 1, -1);
  }

  setFireballs(group) { this.fireballs = group; }

  /** @param {import('../systems/InputManager.js').default} input */
  update(delta, input) {
    if (this.isDead) return;

    const body = this.body;
    const onGround = body.blocked.down;

    // Coyote time
    if (onGround) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    // Jump buffer — queue a jump if pressed just before landing
    if (input.jumpJustDown) this.jumpBufferTimer = JUMP_BUFFER_TIME;
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    this.isGrounded = onGround;
    if (onGround) this.stomboCombo = 0;

    // Horizontal movement
    const left  = input.left;
    const right = input.right;
    const run   = input.run;
    const speed = run ? PLAYER_RUN_SPEED : PLAYER_SPEED;

    if (left && !right) {
      body.setVelocityX(-speed);
      this.setFlipX(true);
      this.facingRight = false;
    } else if (right && !left) {
      body.setVelocityX(speed);
      this.setFlipX(false);
      this.facingRight = true;
    } else {
      // Decelerate smoothly
      body.setVelocityX(body.velocity.x * 0.75);
      if (Math.abs(body.velocity.x) < 5) body.setVelocityX(0);
    }

    // Jump — coyote time + jump buffer for forgiving feel
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      const jv = this.state === PLAYER_STATE.SMALL ? PLAYER_JUMP_VEL : PLAYER_JUMP_VEL - 30;
      body.setVelocityY(jv);
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      SFX.jump();
      QuestSystem.trackStat('totalJumps');
      SaveSystem.incrementStat('totalJumps');
      this._emitDust();
    }

    // Variable jump height — release early = lower arc
    if (!input.jumpHeld && body.velocity.y < -100) {
      body.setVelocityY(body.velocity.y + 32);
    }

    // Fireball
    if (this.state === PLAYER_STATE.FIRE && input.fireJustDown) {
      this._shootFireball();
    }

    // Timers
    if (this.isInvincible) {
      this.invincTimer -= delta;
      this.setAlpha(Math.floor(this.invincTimer / 80) % 2 === 0 ? 0.4 : 1);
      if (this.invincTimer <= 0) {
        this.isInvincible = false;
        this.setAlpha(1);
      }
    }

    if (this.hasStar) {
      this.starTimer -= delta;
      const t = this.scene.time.now;
      this.setTint(Phaser.Display.Color.HSLToColor((t / 100) % 1, 1, 0.6).color);
      if (this.starTimer <= 0) {
        this.hasStar = false;
        this.clearTint();
        this.scene.events.emit('starEnd');
      }
    }

    if (this.fireballCooldown > 0) this.fireballCooldown -= delta;

    // World left boundary
    if (this.x < 8) this.x = 8;

    this._updateAnimation(onGround, left || right);
    this.wasOnGround = onGround;
  }

  _updateAnimation(onGround, moving) {
    const prefix = this.state === PLAYER_STATE.SMALL ? 'nova_small' :
                   this.state === PLAYER_STATE.FIRE  ? 'nova_fire' : 'nova_big';
    if (!onGround) {
      if (this.anims.currentAnim?.key !== `${prefix}_jump`) this.play(`${prefix}_jump`, true);
    } else if (moving) {
      if (this.anims.currentAnim?.key !== `${prefix}_walk`) this.play(`${prefix}_walk`, true);
    } else {
      if (this.anims.currentAnim?.key !== `${prefix}_idle`) this.play(`${prefix}_idle`, true);
    }
  }

  powerUp(type) {
    if (type === 'mushroom') {
      if (this.state === PLAYER_STATE.SMALL) {
        this.grow();
        SFX.powerup();
      } else {
        // Already big — score bonus instead
        this.scene.events.emit('scoreAdd', 500, this.x, this.y);
      }
    } else if (type === 'fireflower') {
      this.state = PLAYER_STATE.FIRE;
      this._setColliderForState();
      SFX.powerup();
    } else if (type === 'star') {
      this.hasStar = true;
      this.starTimer = STAR_DURATION;
      SFX.star_collect();
      this.scene.events.emit('starStart');
      QuestSystem.trackStat('starsCollected');
    }
  }

  grow() {
    this.state = PLAYER_STATE.BIG;
    this._setColliderForState();
    this.scene.tweens.add({
      targets: this,
      scaleX: [1, 1.3, 1, 1.3, 1],
      scaleY: [1, 1.3, 1, 1.3, 1],
      duration: 500,
      ease: 'Linear',
    });
  }

  takeDamage() {
    if (this.isInvincible || this.hasStar || this.isDead) return;
    SFX.hurt();
    this.damageTakenThisLevel = true;
    this.scene.cameras.main.shake(150, 0.01);

    if (this.state !== PLAYER_STATE.SMALL) {
      this.state = PLAYER_STATE.SMALL;
      this._setColliderForState();
      this.isInvincible = true;
      this.invincTimer = INVINCIBILITY_DURATION;
    } else {
      this.die();
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    SFX.death();
    this.body.setVelocity(0, -300);
    this.body.setGravityY(300);
    this.body.setAllowGravity(true);
    this.body.checkCollision.none = true;
    this.setTint(0xff4444);
    SaveSystem.incrementStat('totalDeaths');
    QuestSystem.trackStat('totalDeaths');
    this.scene.time.delayedCall(1500, () => {
      this.scene.events.emit('playerDied');
    });
  }

  stompBounce() {
    this.body.setVelocityY(PLAYER_JUMP_VEL * 0.6);
    this.stomboCombo++;
    if (this.stomboCombo >= 4) this.hasMaxCombo4 = true;
    QuestSystem.trackStat('totalEnemiesStomped');
    SaveSystem.incrementStat('totalEnemiesStomped');
  }

  _shootFireball() {
    if (!this.fireballs || this.fireballCooldown > 0) return;
    this.fireballCooldown = 400;
    const vx = this.facingRight ? 250 : -250;
    const fb = this.fireballs.get(this.x, this.y + 4);
    if (fb) {
      fb.setActive(true).setVisible(true);
      fb.body.setVelocity(vx, -80);
      fb.body.setGravityY(300);
      fb.body.setBounceY(0.6);
      SFX.shoot();
    }
  }

  _emitDust() {
    if (!this.scene.dustEmitter) return;
    this.scene.dustEmitter.emitParticleAt(this.x, this.y + 8, 3);
  }
}
