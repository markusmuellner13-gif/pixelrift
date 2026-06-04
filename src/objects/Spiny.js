import { SFX } from '../systems/AudioSystem.js';
import { ENEMY_STOMP_SCORE, ENEMY_MULTI_BONUS } from '../config.js';

const DETECT_RADIUS = 100;
const CHASE_RADIUS  = 140;
const CHASE_SPEED   = 90;
const PATROL_SPEED  = 55;

export default class Spiny extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'spiny_walk0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(12, 12);
    this.body.setOffset(2, 0);
    this.body.setVelocityX(-PATROL_SPEED);

    this.isDead = false;
    this.chasing = false;
    this.score = ENEMY_STOMP_SCORE;
    this._exclamation = null;

    if (!scene.anims.exists('spiny_walk')) {
      scene.anims.create({
        key: 'spiny_walk',
        frames: [{ key: 'spiny_walk0' }, { key: 'spiny_walk1' }],
        frameRate: 6, repeat: -1,
      });
    }
    this.play('spiny_walk');
    this.setDepth(5);
  }

  update() {
    if (this.isDead) return;

    const scene = this.scene;
    const player = scene.player;
    if (player && !player.isDead) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

      if (dist < DETECT_RADIUS && !this.chasing) {
        this.chasing = true;
        this._showExclamation();
      } else if (dist > CHASE_RADIUS && this.chasing) {
        this.chasing = false;
        this._exclamation?.destroy();
        this._exclamation = null;
      }

      if (this.chasing) {
        const dir = player.x < this.x ? -1 : 1;
        this.body.setVelocityX(dir * CHASE_SPEED);
        this.setFlipX(dir < 0);
        this.anims.timeScale = 1.6;
      } else {
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
      fontSize: '10px', fontFamily: 'monospace', color: '#ff4400',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(12);
    this.scene.tweens.add({ targets: this._exclamation, y: this._exclamation.y - 5, duration: 200, yoyo: true });
  }

  // Spiny hurts player when stomped (spiky shell on top)
  stomp(player) {
    player.takeDamage();
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
}
