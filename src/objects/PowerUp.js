import { SFX } from '../systems/AudioSystem.js';
import { POWERUP_SCORE } from '../config.js';

const TEX_MAP = {
  mushroom: 'mushroom',
  fireflower: 'fireflower',
  star: 'star',
  magnet: 'magnet',
};

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    super(scene, x, y, TEX_MAP[type] || 'mushroom');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.powerType = type;
    this.collected = false;
    this.setDepth(6);

    if (type === 'mushroom' || type === 'magnet') {
      this.body.setVelocityX(60);
      this.body.setBounceX(1);
      this.body.setSize(12, 11);
      this.body.setOffset(0, 1);
    } else if (type === 'star') {
      this.body.setVelocityX(100);
      this.body.setBounceX(1);
      this.body.setBounceY(0.7);
      this.body.setSize(10, 10);
      // Spin tween for star
      scene.tweens.add({ targets: this, angle: 360, duration: 600, repeat: -1 });
    } else {
      // fireflower — stays on block
      this.body.setAllowGravity(false);
      this.body.setImmovable(true);
    }

    // Pop-up animation
    const startY = y;
    scene.tweens.add({
      targets: this, y: y - 16, duration: 300, ease: 'Quad.easeOut',
      onComplete: () => {
        if (type !== 'fireflower') this.body.setAllowGravity(true);
      },
    });
  }

  collect(player) {
    if (this.collected) return;
    this.collected = true;
    SFX.powerup();
    this.scene.events.emit('scoreAdd', POWERUP_SCORE, this.x, this.y);
    player.powerUp(this.powerType);
    this.destroy();
  }

  update() {
    if (this.collected) return;
    if (this.body.blocked.left)  this.body.setVelocityX(Math.abs(this.body.velocity.x));
    if (this.body.blocked.right) this.body.setVelocityX(-Math.abs(this.body.velocity.x));
  }
}
