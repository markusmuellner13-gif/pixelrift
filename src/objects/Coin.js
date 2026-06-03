import { COIN_SCORE } from '../config.js';
import { SFX } from '../systems/AudioSystem.js';

export default class Coin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, fromBlock = false) {
    super(scene, x, y, 'coin0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(8, 9);
    this.body.setOffset(1, 0);
    this.collected = false;
    this.setDepth(4);

    if (!scene.anims.exists('coin_spin')) {
      scene.anims.create({
        key: 'coin_spin',
        frames: [{ key: 'coin0' }, { key: 'coin1' }, { key: 'coin2' }, { key: 'coin1' }],
        frameRate: 8, repeat: -1,
      });
    }
    this.play('coin_spin');

    if (fromBlock) {
      // Pop-up animation from question block
      this.body.setAllowGravity(false);
      const startY = y;
      scene.tweens.add({
        targets: this,
        y: y - 24,
        duration: 200,
        ease: 'Quad.easeOut',
        yoyo: false,
        onComplete: () => {
          scene.tweens.add({
            targets: this,
            y: startY,
            duration: 200,
            ease: 'Quad.easeIn',
            onComplete: () => this.destroy()
          });
        }
      });
      // Collect immediately after animation
      scene.time.delayedCall(50, () => {
        SFX.coin();
        scene.events.emit('collectCoin', 1);
        scene.events.emit('scoreAdd', COIN_SCORE, x, y - 12);
      });
    }
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    SFX.coin();
    this.scene.events.emit('collectCoin', 1);
    this.scene.events.emit('scoreAdd', COIN_SCORE, this.x, this.y);
    this.scene.tweens.add({
      targets: this,
      y: this.y - 16, alpha: 0,
      duration: 200,
      onComplete: () => this.destroy()
    });
  }
}
