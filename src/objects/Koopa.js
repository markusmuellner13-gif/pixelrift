import { SFX } from '../systems/AudioSystem.js';
import { ENEMY_STOMP_SCORE, ENEMY_MULTI_BONUS } from '../config.js';

export default class Koopa extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'koopa_walk0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(12, 14);
    this.body.setOffset(2, 0);
    this.body.setVelocityX(-40);

    this.isDead = false;
    this.isShell = false;
    this.shellMoving = false;
    this.score = ENEMY_STOMP_SCORE;

    if (!scene.anims.exists('koopa_walk')) {
      scene.anims.create({
        key: 'koopa_walk',
        frames: [{ key: 'koopa_walk0' }, { key: 'koopa_walk1' }],
        frameRate: 6, repeat: -1,
      });
    }
    this.play('koopa_walk');
    this.setDepth(5);
  }

  update() {
    if (this.isDead) return;
    if (this.isShell && this.shellMoving) return; // handled by physics
    if (!this.isShell) {
      if (this.body.blocked.left)  this.body.setVelocityX(40);
      if (this.body.blocked.right) this.body.setVelocityX(-40);
    }
  }

  stomp(player, combo) {
    if (this.isDead) return;
    if (!this.isShell) {
      // First stomp: retract into shell
      this.isShell = true;
      this.shellMoving = false;
      SFX.stomp();
      this.setTexture('koopa_shell');
      this.body.setSize(12, 10);
      this.body.setOffset(2, 4);
      this.body.setVelocityX(0);
      this.scene.events.emit('scoreAdd', this.score, this.x, this.y);
      player.stompBounce();
    } else if (!this.shellMoving) {
      // Second touch: kick shell
      this._kickShell(player);
    } else {
      // Moving shell — stomp to stop
      this.shellMoving = false;
      this.body.setVelocityX(0);
      SFX.stomp();
      player.stompBounce();
    }
  }

  _kickShell(player) {
    const dir = player.x < this.x ? 1 : -1;
    this.shellMoving = true;
    this.body.setVelocityX(dir * 250);
    SFX.enemy_kick();
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
}
