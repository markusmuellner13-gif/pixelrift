import { SFX } from '../systems/AudioSystem.js';
import { ENEMY_STOMP_SCORE, ENEMY_MULTI_BONUS } from '../config.js';

const DETECT_RADIUS = 80;
const CHASE_RADIUS  = 120;
const CHASE_SPEED   = 65;
const PATROL_SPEED  = 40;

export default class Koopa extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'koopa_walk0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(12, 14);
    this.body.setOffset(2, 0);
    this.body.setVelocityX(-PATROL_SPEED);

    this.isDead = false;
    this.isShell = false;
    this.shellMoving = false;
    this.chasing = false;
    this.score = ENEMY_STOMP_SCORE;
    this._exclamation = null;

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
    if (this.isShell && this.shellMoving) return;

    const scene = this.scene;
    const player = scene.player;
    if (player && !player.isDead && !this.isShell) {
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
        this.anims.timeScale = 1.5;
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
      fontSize: '10px', fontFamily: 'monospace', color: '#ffaa00',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(12);
    this.scene.tweens.add({ targets: this._exclamation, y: this._exclamation.y - 5, duration: 200, yoyo: true });
  }

  stomp(player, combo) {
    if (this.isDead) return;
    this._exclamation?.destroy();
    if (!this.isShell) {
      this.isShell = true;
      this.shellMoving = false;
      this.chasing = false;
      SFX.stomp();
      this.setTexture('koopa_shell');
      this.body.setSize(12, 10);
      this.body.setOffset(2, 4);
      this.body.setVelocityX(0);
      this.scene.events.emit('scoreAdd', this.score, this.x, this.y);
      this.scene.events.emit('enemyKilled');
      player.stompBounce();
    } else if (!this.shellMoving) {
      this._kickShell(player);
    } else {
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
