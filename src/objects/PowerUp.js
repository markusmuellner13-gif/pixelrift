import { SFX } from '../systems/AudioSystem.js';
import { POWERUP_SCORE } from '../config.js';

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    const texMap = { mushroom: 'mushroom', fireflower: 'fireflower', star: 'star' };
    super(scene, x, y, texMap[type] || 'mushroom');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.powerType = type;
    this.collected = false;
    this.setDepth(6);

    if (type === 'mushroom') {
      this.body.setVelocityX(60);
      this.body.setBounceX(1);
      this.body.setSize(12, 11);
      this.body.setOffset(2, 0);
    } else if (type === 'star') {
      this.body.setVelocityX(100);
      this.body.setBounceX(1);
      this.body.setBounceY(0.7);
      this.body.setSize(10, 10);
    } else {
      // fireflower — stays on block
      this.body.setAllowGravity(false);
      this.body.setImmovable(true);
    }

    // Pop-up animation
    const startY = y;
    scene.tweens.add({
      targets: this,
      y: y - 16,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (type !== 'fireflower') {
          this.body.setAllowGravity(true);
        }
      }
    });

    // Star bounces
    if (type === 'star') {
      if (!scene.anims.exists('star_spin')) {
        scene.anims.create({
          key: 'star_spin',
          frames: [{ key: 'star' }],
          frameRate: 1, repeat: -1,
        });
      }
      this.play('star_spin');
    }
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
    // Bounce off walls
    if (this.body.blocked.left)  this.body.setVelocityX(Math.abs(this.body.velocity.x));
    if (this.body.blocked.right) this.body.setVelocityX(-Math.abs(this.body.velocity.x));
  }
}
