import { SFX } from '../systems/AudioSystem.js';
import { FONT } from '../config.js';
import { ENEMY_STOMP_SCORE, ENEMY_MULTI_BONUS } from '../config.js';

const DETECT_RADIUS = 90;
const CHASE_RADIUS  = 130;
const CHASE_SPEED   = 85;
const PATROL_SPEED  = 50;

export default class Goomba extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'goomba_walk0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(12, 10);
    this.body.setOffset(2, 0);
    this.body.setVelocityX(-PATROL_SPEED);

    this.isDead = false;
    this.chasing = false;
    this.score = ENEMY_STOMP_SCORE;

    this._exclamation = null;

    if (!scene.anims.exists('goomba_walk')) {
      scene.anims.create({
        key: 'goomba_walk',
        frames: [{ key: 'goomba_walk0' }, { key: 'goomba_walk1' }],
        frameRate: 6, repeat: -1,
      });
    }
    this.play('goomba_walk');
    this.setDepth(5);
  }

  update(delta) {
    if (this.isDead) return;

    // Chase detection
    const scene = this.scene;
    const player = scene.player;
    if (player && !player.isDead) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

      if (dist < DETECT_RADIUS && !this.chasing) {
        this.chasing = true;
        this._showExclamation();
        this.play('goomba_walk', true);
      } else if (dist > CHASE_RADIUS && this.chasing) {
        this.chasing = false;
        this._exclamation?.destroy();
        this._exclamation = null;
      }

      if (this.chasing) {
        const dir = player.x < this.x ? -1 : 1;
        this.body.setVelocityX(dir * CHASE_SPEED);
        this.setFlipX(dir < 0);
        this.anims.timeScale = 1.5;
      } else {
        // Normal patrol
        this.anims.timeScale = 1;
        if (this.body.blocked.left)  this.body.setVelocityX(PATROL_SPEED);
        if (this.body.blocked.right) this.body.setVelocityX(-PATROL_SPEED);
        this.setFlipX(this.body.velocity.x > 0);
      }
    }

    if (this._exclamation) {
      this._exclamation.x = this.x;
      this._exclamation.y = this.y - 18;
    }
  }

  _showExclamation() {
    this._exclamation = this.scene.add.text(this.x, this.y - 18, '!', {
      fontSize: '10px', fontFamily: FONT, color: '#ff4444',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(12);
    this.scene.tweens.add({
      targets: this._exclamation, y: this._exclamation.y - 5,
      duration: 200, yoyo: true,
    });
  }

  stomp(player, combo) {
    if (this.isDead) return;
    this.isDead = true;
    this._exclamation?.destroy();
    SFX.stomp();
    const bonus = combo > 1 ? (combo - 1) * ENEMY_MULTI_BONUS : 0;
    this.body.setVelocityX(0);
    this.body.setAllowGravity(false);
    this.setTexture('goomba_dead');
    this.body.setSize(12, 5);
    this.body.setOffset(2, 5);
    this.scene.events.emit('scoreAdd', this.score + bonus, this.x, this.y);
    this.scene.events.emit('enemyKilled');
    // Hit-flash
    this.setTint(0xff8888);
    this.scene.time.delayedCall(400, () => this.destroy());
    player.stompBounce();
    if (combo > 1) this._showComboText(combo);
  }

  hitByStar(combo) {
    if (this.isDead) return;
    this.isDead = true;
    this._exclamation?.destroy();
    const bonus = combo > 1 ? (combo - 1) * ENEMY_MULTI_BONUS : 0;
    this.scene.events.emit('scoreAdd', this.score + bonus, this.x, this.y);
    this.scene.events.emit('enemyKilled');
    this.scene.tweens.add({
      targets: this, y: this.y - 20, alpha: 0,
      duration: 300, onComplete: () => this.destroy()
    });
  }

  hitByFireball() {
    if (this.isDead) return;
    this.isDead = true;
    this._exclamation?.destroy();
    SFX.stomp();
    this.scene.events.emit('scoreAdd', this.score, this.x, this.y);
    this.scene.events.emit('enemyKilled');
    this.scene.tweens.add({
      targets: this, y: this.y - 15, alpha: 0, angle: 180,
      duration: 400, onComplete: () => this.destroy()
    });
  }

  _showComboText(n) {
    const txt = this.scene.add.text(this.x, this.y - 20, `COMBO ×${n}!`, {
      fontSize: '7px', fontFamily: FONT, color: '#ff8800',
      stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(15);
    this.scene.tweens.add({
      targets: txt, y: txt.y - 16, alpha: 0,
      duration: 700, onComplete: () => txt.destroy()
    });
  }
}
