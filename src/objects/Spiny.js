import { SFX } from '../systems/AudioSystem.js';
import { ENEMY_STOMP_SCORE, ENEMY_MULTI_BONUS } from '../config.js';

// Spiny cannot be stomped — only killed by star or fire
export default class Spiny extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'spiny_walk0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(12, 12);
    this.body.setOffset(2, 0);
    this.body.setVelocityX(-55);

    this.isDead = false;
    this.score = ENEMY_STOMP_SCORE;

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
    if (this.body.blocked.left)  this.body.setVelocityX(55);
    if (this.body.blocked.right) this.body.setVelocityX(-55);
  }

  // Spiny hurts player when stomped — handled in GameScene
  stomp(player) {
    player.takeDamage();
  }

  hitByStar(combo) {
    if (this.isDead) return;
    this.isDead = true;
    const bonus = combo > 1 ? (combo - 1) * ENEMY_MULTI_BONUS : 0;
    this.scene.events.emit('scoreAdd', this.score + bonus, this.x, this.y);
    this.scene.tweens.add({
      targets: this, y: this.y - 20, alpha: 0,
      duration: 300, onComplete: () => this.destroy()
    });
  }

  hitByFireball() {
    if (this.isDead) return;
    this.isDead = true;
    SFX.stomp();
    this.scene.events.emit('scoreAdd', this.score, this.x, this.y);
    this.scene.tweens.add({
      targets: this, y: this.y - 15, alpha: 0, angle: 180,
      duration: 400, onComplete: () => this.destroy()
    });
  }
}
