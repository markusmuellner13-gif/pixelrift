import { SCENES, WORLDS, LEVELS_PER_WORLD } from '../config.js';
import { SFX, playMusic } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class LevelCompleteScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.LVLCOMPLETE }); }

  init(data) { this._data = data; }

  create() {
    const { width, height } = this.scale;
    const d = this._data;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a);

    // Animated stars
    for (let i = 0; i < 40; i++) {
      const s = this.add.image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 'star_twinkle')
        .setAlpha(Math.random() * 0.7 + 0.2);
      this.tweens.add({ targets: s, alpha: 0.1, duration: Phaser.Math.Between(300, 1200), yoyo: true, repeat: -1 });
    }

    this.add.text(width / 2, 30, 'LEVEL COMPLETE!', {
      fontSize: '18px', fontFamily: 'monospace', color: '#ffd700',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, 52, `World ${d.world} - Level ${d.level}`, {
      fontSize: '9px', fontFamily: 'monospace', color: '#aaaaff',
    }).setOrigin(0.5);

    // Stars display
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(width / 2 - 24 + i * 24, 72, '★', {
        fontSize: '18px', fontFamily: 'monospace',
        color: i < d.stars ? '#ffd700' : '#333355',
      }).setOrigin(0.5).setAlpha(0);
      this.time.delayedCall(500 + i * 300, () => {
        this.tweens.add({ targets: star, alpha: 1, scaleX: [0, 1.3, 1], scaleY: [0, 1.3, 1], duration: 300 });
        if (i < d.stars) SFX.coin();
      });
    }

    // Score breakdown
    const rows = [
      ['SCORE', d.score.toLocaleString()],
      ['TIME BONUS', `+${(d.timeBonus || 0).toLocaleString()}`],
      ['HEIGHT BONUS', `+${(d.heightBonus || 0).toLocaleString()}`],
      ['LIVES', `× ${d.lives}`],
    ];
    rows.forEach(([label, val], i) => {
      this.add.text(width / 2 - 60, 100 + i * 14, label, {
        fontSize: '7px', fontFamily: 'monospace', color: '#ccccff',
      });
      this.add.text(width / 2 + 60, 100 + i * 14, val, {
        fontSize: '7px', fontFamily: 'monospace', color: '#ffffff',
      }).setOrigin(1, 0);
    });

    // Divider
    this.add.rectangle(width / 2, 158, 180, 1, 0x444466);

    // Total
    const hs = SaveSystem.get('highScore') || 0;
    this.add.text(width / 2, 163, `BEST: ${hs.toLocaleString()}`, {
      fontSize: '7px', fontFamily: 'monospace', color: '#ffaaaa',
    }).setOrigin(0.5);

    // Buttons
    const nextWorld = d.level === LEVELS_PER_WORLD ? d.world + 1 : d.world;
    const nextLevel = d.level === LEVELS_PER_WORLD ? 1 : d.level + 1;
    const hasNext = nextWorld <= WORLDS && SaveSystem.isLevelUnlocked(nextWorld, nextLevel);

    const btns = [];
    if (hasNext) {
      btns.push({ label: '▶ NEXT LEVEL', fn: () => this._goTo(nextWorld, nextLevel) });
    }
    btns.push({ label: '↺ RETRY', fn: () => this._retry() });
    btns.push({ label: '⌂ WORLD MAP', fn: () => this._worldMap() });

    btns.forEach((b, i) => {
      const txt = this.add.text(width / 2, 185 + i * 20, b.label, {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffffff',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      txt.on('pointerover', () => txt.setColor('#ffd700'));
      txt.on('pointerout',  () => txt.setColor('#ffffff'));
      txt.on('pointerdown', () => { SFX.menu_select(); b.fn(); });
    });

    // Auto-advance after 8 seconds
    if (hasNext) {
      let countdown = 8;
      const autoTxt = this.add.text(width / 2, height - 12, `Auto-next in ${countdown}s`, {
        fontSize: '6px', fontFamily: 'monospace', color: '#556677',
      }).setOrigin(0.5);
      const timer = this.time.addEvent({
        delay: 1000, repeat: 7,
        callback: () => {
          countdown--;
          autoTxt.setText(`Auto-next in ${countdown}s`);
          if (countdown <= 0) { this._goTo(nextWorld, nextLevel); }
        }
      });
    }

    playMusic('menu');
  }

  _goTo(world, level) {
    this.scene.start(SCENES.GAME, {
      world, level,
      score: this._data.score,
      lives: this._data.lives,
      coins: this._data.coins,
    });
  }

  _retry() {
    this.scene.start(SCENES.GAME, {
      world: this._data.world, level: this._data.level,
      score: this._data.score, lives: this._data.lives, coins: this._data.coins,
    });
  }

  _worldMap() {
    this.scene.start(SCENES.WORLDMAP, {
      world: this._data.world, level: this._data.level,
    });
  }
}
