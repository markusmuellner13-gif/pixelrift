import { SFX } from '../systems/AudioSystem.js';
import { ENEMY_STOMP_SCORE, ENEMY_MULTI_BONUS } from '../config.js';

export default class Goomba extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'goomba_walk0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(12, 10);
    this.body.setOffset(2, 0);
    this.body.setVelocityX(-50);

    this.isDead = false;
    this.isShell = false;
    this.score = ENEMY_STOMP_SCORE;

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

  update() {
    if (this.isDead) return;
    // Reverse on wall hit
    if (this.body.blocked.left)  this.body.setVelocityX(50);
    if (this.body.blocked.right) this.body.setVelocityX(-50);
  }

  stomp(player, combo) {
    if (this.isDead) return;
    this.isDead = true;
    SFX.stomp();
    const bonus = combo > 1 ? (combo - 1) * ENEMY_MULTI_BONUS : 0;
    const pts = this.score + bonus;
    this.body.setVelocityX(0);
    this.body.setAllowGravity(false);
    this.setTexture('goomba_dead');
    this.body.setSize(12, 5);
    this.body.setOffset(2, 5);
    this.scene.events.emit('scoreAdd', pts, this.x, this.y);
    this.scene.time.delayedCall(400, () => this.destroy());
    player.stompBounce();
  }

  hitByStar(combo) {
    if (this.isDead) return;
    this.isDead = true;
    const bonus = combo > 1 ? (combo - 1) * ENEMY_MULTI_BONUS : 0;
    this.scene.events.emit('scoreAdd', this.score + bonus, this.x, this.y);
    this.scene.tweens.add({
      targets: this,
      y: this.y - 20, alpha: 0,
      duration: 300, onComplete: () => this.destroy()
    });
  }
}
