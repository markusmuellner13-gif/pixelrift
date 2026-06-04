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
      const startY = y;
      scene.tweens.add({
        targets: this, y: y - 24, duration: 200, ease: 'Quad.easeOut',
        onComplete: () => {
          scene.tweens.add({ targets: this, y: startY, duration: 200, ease: 'Quad.easeIn', onComplete: () => this.destroy() });
        }
      });
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
    // Burst effect
    this.scene.coinEmitter?.emitParticleAt(this.x, this.y, 4);
    this.scene.tweens.add({
      targets: this, y: this.y - 20, alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: 220, onComplete: () => this.destroy()
    });
  }

  /** Called every frame from GameScene when player has magnet active */
  attractToPlayer(player) {
    if (this.collected) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8) {
      this.collect();
      return;
    }
    const speed = 180;
    this.x += (dx / dist) * speed * (1 / 60);
    this.y += (dy / dist) * speed * (1 / 60);
    // Update physics body position
    this.body.reset(this.x, this.y);
  }
}
