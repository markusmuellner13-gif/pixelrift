import {
  COYOTE_TIME, JUMP_BUFFER_TIME, PLAYER_SPEED, PLAYER_RUN_SPEED, PLAYER_JUMP_VEL,
  INVINCIBILITY_DURATION, STAR_DURATION,
  DASH_SPEED, DASH_DURATION, DASH_COOLDOWN, DASH_DOUBLE_TAP_WINDOW,
  WALL_JUMP_VEL_X, WALL_JUMP_VEL_Y, WALL_SLIDE_GRAVITY,
  CROUCH_SPEED, CROUCH_SLIDE_SPEED, CROUCH_SLIDE_DURATION,
  MAGNET_RADIUS, MAGNET_PULL_SPEED, MAGNET_DURATION,
  PLAYER_ACCEL, PLAYER_TURN_ACCEL, PLAYER_FRICTION, PLAYER_AIR_DRAG,
  PLAYER_AIR_CONTROL, SKID_MIN_SPEED, FALL_GRAVITY_BONUS, JUMP_SPEED_BONUS,
} from '../config.js';
import { SFX } from '../systems/AudioSystem.js';
import QuestSystem from '../systems/QuestSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export const PLAYER_STATE = { SMALL: 'small', BIG: 'big', FIRE: 'fire' };

/** Texture suffix for the currently equipped skin ('' for classic) */
export function skinSuffix() {
  const skin = SaveSystem.get('selectedSkin') || 'classic';
  return skin === 'classic' ? '' : `_${skin}`;
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, `nova_small_idle${skinSuffix()}`);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.skinSfx = skinSuffix();
    // Fall back to classic if the saved skin's textures are missing
    if (this.skinSfx && !scene.textures.exists(`nova_small_idle${this.skinSfx}`)) {
      this.skinSfx = '';
      this.setTexture('nova_small_idle');
    }

    this.state = PLAYER_STATE.SMALL;
    this.isInvincible = false;
    this.hasStar = false;
    this.isDead = false;
    this.isGrounded = false;
    this.facingRight = true;
    this.wasOnGround = false;
    this.isCrouching = false;
    this.isSliding = false;

    // Timers
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.invincTimer = 0;
    this.starTimer = 0;
    this.fireballCooldown = 0;
    this.fireballs = null;

    // Dash
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.isDashing = false;
    this._lastLeftTime = -9999;
    this._lastRightTime = -9999;
    this._dashTrail = [];

    // Wall jump
    this.onWall = false;
    this.wallDir = 0; // -1 left wall, +1 right wall
    this.wallJumpLock = 0; // brief lockout after wall jump to prevent re-sticking
    this._lastWallSide = 0;

    // Crouch/slide
    this.slideTimer = 0;
    this.slideDir = 1;

    // Combo
    this.stomboCombo = 0;
    this.damageTakenThisLevel = false;
    this.hasMaxCombo4 = false;

    // Magnet
    this.hasMagnet = false;
    this.magnetTimer = 0;

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
      this.body.setSize(10, this.isCrouching ? 8 : 13);
      this.body.setOffset(1, this.isCrouching ? 5 : 0);
    } else {
      this.body.setSize(10, this.isCrouching ? 10 : 16);
      this.body.setOffset(1, this.isCrouching ? 6 : 0);
    }
  }

  _setupAnimations() {
    const a = this.scene.anims;
    const s = this.skinSfx;
    const safe = (key, frames, fr, rpt) => {
      if (!a.exists(key)) a.create({ key, frames: frames.map(f => ({ key: f })), frameRate: fr, repeat: rpt });
    };
    safe(`nova_small_walk${s}`, [`nova_small_walk0${s}`,`nova_small_walk1${s}`], 8, -1);
    safe(`nova_small_idle${s}`, [`nova_small_idle${s}`], 1, -1);
    safe(`nova_small_jump${s}`, [`nova_small_jump${s}`], 1, -1);
    safe(`nova_big_walk${s}`,   [`nova_big_idle${s}`,`nova_big_idle${s}`], 8, -1);
    safe(`nova_big_idle${s}`,   [`nova_big_idle${s}`], 1, -1);
    safe(`nova_big_jump${s}`,   [`nova_big_jump${s}`], 1, -1);
    safe(`nova_fire_walk${s}`,  [`nova_fire_idle${s}`,`nova_fire_idle${s}`], 8, -1);
    safe(`nova_fire_idle${s}`,  [`nova_fire_idle${s}`], 1, -1);
    safe(`nova_fire_jump${s}`,  [`nova_big_jump${s}`], 1, -1);
  }

  setFireballs(group) { this.fireballs = group; }

  /** @param {import('../systems/InputManager.js').default} input */
  update(delta, input) {
    if (this.isDead) return;

    const body = this.body;
    const onGround = body.blocked.down;
    const now = this.scene.time.now;

    // ── Coyote time ──────────────────────────────────────────────
    if (onGround) {
      this.coyoteTimer = COYOTE_TIME;
      this.onWall = false;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    // ── Jump buffer ──────────────────────────────────────────────
    if (input.jumpJustDown) this.jumpBufferTimer = JUMP_BUFFER_TIME;
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    this.isGrounded = onGround;
    if (onGround) { this.stomboCombo = 0; this._lastWallSide = 0; }

    // ── Wall detection ───────────────────────────────────────────
    const touchingLeft  = body.blocked.left;
    const touchingRight = body.blocked.right;
    if (!onGround && this.wallJumpLock <= 0) {
      if (touchingLeft)  { this.onWall = true; this.wallDir = -1; }
      else if (touchingRight) { this.onWall = true; this.wallDir = 1; }
      else { this.onWall = false; this.wallDir = 0; }
    }
    if (this.wallJumpLock > 0) this.wallJumpLock -= delta;

    // Wall slide — slow fall while touching wall; otherwise extra gravity
    // when falling for a snappier, Mario-like jump arc
    if (this.onWall && !onGround && body.velocity.y > 0) {
      body.setGravityY(-900 + WALL_SLIDE_GRAVITY);
      if (body.velocity.y > 80) body.setVelocityY(80);
      this._emitDust();
    } else if (!onGround && body.velocity.y > 0) {
      body.setGravityY(FALL_GRAVITY_BONUS);
    } else {
      body.setGravityY(0);
    }

    // ── Dash double-tap detection ────────────────────────────────
    if (!this.isDashing && this.dashCooldown <= 0) {
      if (input.left) {
        if (now - this._lastLeftTime < DASH_DOUBLE_TAP_WINDOW && this._lastLeftTime > 0) {
          this._startDash(-1);
          this._lastLeftTime = -9999;
        } else if (!this._leftWasDown) {
          this._lastLeftTime = now;
        }
        this._leftWasDown = true;
      } else { this._leftWasDown = false; }

      if (input.right) {
        if (now - this._lastRightTime < DASH_DOUBLE_TAP_WINDOW && this._lastRightTime > 0) {
          this._startDash(1);
          this._lastRightTime = -9999;
        } else if (!this._rightWasDown) {
          this._lastRightTime = now;
        }
        this._rightWasDown = true;
      } else { this._rightWasDown = false; }
    }

    // ── Active dash ──────────────────────────────────────────────
    if (this.isDashing) {
      this.dashTimer -= delta;
      this._spawnDashTrail();
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.isInvincible = false;
        this.setAlpha(1);
        body.setVelocityX(0);
      } else {
        body.setVelocityX(DASH_SPEED * this._dashDir);
        body.setVelocityY(0);
        return; // no other movement during dash
      }
    }

    // ── Crouch ───────────────────────────────────────────────────
    const wantCrouch = input.down && onGround && !this.isSliding;
    if (wantCrouch !== this.isCrouching) {
      this.isCrouching = wantCrouch;
      this._setColliderForState();
      if (wantCrouch) SFX.crouch();
    }

    // Crouch-slide: hold run while crouching/moving
    if (this.isCrouching && input.run && (input.left || input.right) && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = CROUCH_SLIDE_DURATION;
      this.slideDir = input.right ? 1 : -1;
      SFX.slide();
    }

    if (this.isSliding) {
      this.slideTimer -= delta;
      body.setVelocityX(CROUCH_SLIDE_SPEED * this.slideDir);
      this.setFlipX(this.slideDir < 0);
      if (this.slideTimer <= 0 || onGround === false) {
        this.isSliding = false;
        this.isCrouching = false;
        this._setColliderForState();
      }
      // Jump out of slide
      if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
        this.isSliding = false;
        this.isCrouching = false;
        this._setColliderForState();
        this._doJump();
      }
      this._updateAnimation(onGround, true);
      this.wasOnGround = onGround;
      return;
    }

    // ── Horizontal movement (acceleration + momentum) ────────────
    const left  = input.left;
    const right = input.right;
    const run   = input.run;
    this._jumpHeldNow = input.jumpHeld;

    const targetSpeed = this.isCrouching ? CROUCH_SPEED : (run ? PLAYER_RUN_SPEED : PLAYER_SPEED);
    const dt  = delta / 1000;
    const dir = (left && !right) ? -1 : (right && !left) ? 1 : 0;
    let vx = body.velocity.x;

    if (dir !== 0) {
      const turning = vx * dir < -1;
      // Skid: reversing at speed on the ground
      if (turning && onGround && Math.abs(vx) > SKID_MIN_SPEED) {
        if (!this._skidding) { this._skidding = true; SFX.skid(); }
        this._emitDust();
      } else if (!turning) {
        this._skidding = false;
      }
      const accel = (turning ? PLAYER_TURN_ACCEL : PLAYER_ACCEL) * (onGround ? 1 : PLAYER_AIR_CONTROL);
      vx += dir * accel * dt;
      // Don't exceed target speed; if faster (e.g. released run), ease down
      if (!turning && Math.abs(vx) > targetSpeed) {
        vx = dir * Math.max(targetSpeed, Math.abs(vx) - PLAYER_FRICTION * dt);
      }
      this.setFlipX(dir < 0);
      this.facingRight = dir > 0;
    } else {
      this._skidding = false;
      const friction = onGround ? PLAYER_FRICTION : PLAYER_AIR_DRAG;
      const mag = Math.max(0, Math.abs(vx) - friction * dt);
      vx = Math.sign(vx) * mag;
    }
    body.setVelocityX(vx);

    // ── Wall jump ─────────────────────────────────────────────────
    if (this.onWall && !onGround && this.jumpBufferTimer > 0 && this.wallDir !== this._lastWallSide) {
      body.setVelocityX(-this.wallDir * WALL_JUMP_VEL_X);
      body.setVelocityY(WALL_JUMP_VEL_Y);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.wallJumpLock = 200;
      this._lastWallSide = this.wallDir;
      this.onWall = false;
      this.setFlipX(this.wallDir > 0); // face away from wall
      this.facingRight = this.wallDir > 0;
      SFX.wall_jump();
      this._emitDust();
      return;
    }

    // ── Normal jump ──────────────────────────────────────────────
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.isCrouching) {
      this._doJump();
    }

    // Variable jump height — releasing early cuts the jump once
    // (single cut is frame-rate independent, unlike per-frame damping)
    if (!input.jumpHeld && body.velocity.y < -120 && !this._jumpCut) {
      body.setVelocityY(body.velocity.y * 0.45);
      this._jumpCut = true;
    }
    if (onGround) this._jumpCut = false;

    // ── Fireball ─────────────────────────────────────────────────
    if (this.state === PLAYER_STATE.FIRE && input.fireJustDown) {
      this._shootFireball();
    }

    // ── Timers ───────────────────────────────────────────────────
    this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    this.fireballCooldown = Math.max(0, this.fireballCooldown - delta);

    if (this.isInvincible) {
      this.invincTimer -= delta;
      this.setAlpha(Math.floor(this.invincTimer / 80) % 2 === 0 ? 0.4 : 1);
      if (this.invincTimer <= 0) { this.isInvincible = false; this.setAlpha(1); }
    }

    if (this.hasStar) {
      this.starTimer -= delta;
      this.setTint(Phaser.Display.Color.HSLToColor((this.scene.time.now / 100) % 1, 1, 0.6).color);
      if (this.starTimer <= 0) {
        this.hasStar = false;
        this.clearTint();
        this.scene.events.emit('starEnd');
      }
    }

    if (this.hasMagnet) {
      this.magnetTimer -= delta;
      if (this.magnetTimer <= 0) {
        this.hasMagnet = false;
        this._magnetRing?.destroy();
        this._magnetRing = null;
      } else {
        // Pulse ring
        if (!this._magnetRing) {
          this._magnetRing = this.scene.add.circle(0, 0, MAGNET_RADIUS, 0xaa44ff, 0.1).setDepth(9);
        }
        this._magnetRing.x = this.x;
        this._magnetRing.y = this.y;
      }
    }

    // World left boundary
    if (this.x < 8) this.x = 8;

    this._updateAnimation(onGround, left || right);
    this.wasOnGround = onGround;
  }

  _doJump() {
    let jv = this.state === PLAYER_STATE.SMALL ? PLAYER_JUMP_VEL : PLAYER_JUMP_VEL - 30;
    // Running jumps go higher, like Mario
    jv -= Math.abs(this.body.velocity.x) * JUMP_SPEED_BONUS;
    this._jumpCut = false;
    this.body.setVelocityY(jv);
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    SFX.jump();
    QuestSystem.trackStat('totalJumps');
    SaveSystem.incrementStat('totalJumps');
    this._emitDust();
  }

  _startDash(dir) {
    this.isDashing = true;
    this.dashTimer = DASH_DURATION;
    this.dashCooldown = DASH_COOLDOWN;
    this._dashDir = dir;
    this.isInvincible = true;
    this.invincTimer = DASH_DURATION;
    this.setFlipX(dir < 0);
    this.facingRight = dir > 0;
    SFX.dash();
    this.scene.cameras.main.shake(60, 0.005);
  }

  _spawnDashTrail() {
    const trail = this.scene.add.image(this.x, this.y, this.texture.key)
      .setAlpha(0.35).setFlipX(this.flipX).setScale(this.scaleX, this.scaleY).setDepth(9);
    this.scene.tweens.add({ targets: trail, alpha: 0, scaleX: 0.5, duration: 200, onComplete: () => trail.destroy() });
  }

  _updateAnimation(onGround, moving) {
    const prefix = this.state === PLAYER_STATE.SMALL ? 'nova_small' :
                   this.state === PLAYER_STATE.FIRE  ? 'nova_fire' : 'nova_big';
    const s = this.skinSfx;
    if (!onGround) {
      if (this.anims.currentAnim?.key !== `${prefix}_jump${s}`) this.play(`${prefix}_jump${s}`, true);
    } else if (moving) {
      if (this.anims.currentAnim?.key !== `${prefix}_walk${s}`) this.play(`${prefix}_walk${s}`, true);
    } else {
      if (this.anims.currentAnim?.key !== `${prefix}_idle${s}`) this.play(`${prefix}_idle${s}`, true);
    }
  }

  powerUp(type) {
    if (type === 'mushroom') {
      if (this.state === PLAYER_STATE.SMALL) { this.grow(); SFX.powerup(); }
      else this.scene.events.emit('scoreAdd', 500, this.x, this.y);
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
    } else if (type === 'magnet') {
      this.hasMagnet = true;
      this.magnetTimer = MAGNET_DURATION;
      SFX.magnet_on();
    }
  }

  grow() {
    this.state = PLAYER_STATE.BIG;
    this._setColliderForState();
    this.scene.tweens.add({
      targets: this, scaleX: [1,1.3,1,1.3,1], scaleY: [1,1.3,1,1.3,1],
      duration: 500, ease: 'Linear',
    });
  }

  takeDamage() {
    if (this.isInvincible || this.hasStar || this.isDead || this.isDashing) return;
    SFX.hurt();
    this.damageTakenThisLevel = true;
    this.scene.cameras.main.shake(150, 0.01);
    if (this.state !== PLAYER_STATE.SMALL) {
      this.state = PLAYER_STATE.SMALL;
      this.isCrouching = false;
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
    this._magnetRing?.destroy();
    SaveSystem.incrementStat('totalDeaths');
    QuestSystem.trackStat('totalDeaths');
    this.scene.time.delayedCall(1500, () => { this.scene.events.emit('playerDied'); });
  }

  stompBounce() {
    // Holding jump on impact bounces higher — chain stomps like Mario
    this.body.setVelocityY(PLAYER_JUMP_VEL * (this._jumpHeldNow ? 0.95 : 0.55));
    this._jumpCut = false;
    this.stomboCombo++;
    if (this.stomboCombo >= 4) this.hasMaxCombo4 = true;
    QuestSystem.trackStat('totalEnemiesStomped');
    SaveSystem.incrementStat('totalEnemiesStomped');
    SFX.combo(this.stomboCombo);
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
    this.scene.dustEmitter?.emitParticleAt(this.x, this.y + 8, 3);
  }
}
