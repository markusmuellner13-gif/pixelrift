import { SCENES, PLAYER_LIVES_START } from '../config.js';
import { SFX, playMusic } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.GAMEOVER }); }

  init(data) { this._data = data; }

  create() {
    const { width, height } = this.scale;
    const d = this._data;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a);

    // Flicker effect
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0.1);
    this.tweens.add({ targets: overlay, alpha: 0, duration: 800 });

    this.add.text(width / 2, height / 2 - 60, 'GAME OVER', {
      fontSize: '22px', fontFamily: 'monospace', color: '#ff4444',
      stroke: '#880000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Score
    this.add.text(width / 2, height / 2 - 25, `SCORE: ${(d.score || 0).toLocaleString()}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5);

    // High score
    const hs = SaveSystem.get('highScore') || 0;
    const isNew = d.score >= hs;
    if (isNew) {
      this.add.text(width / 2, height / 2 - 10, '★ NEW HIGH SCORE! ★', {
        fontSize: '8px', fontFamily: 'monospace', color: '#ffaa00',
      }).setOrigin(0.5);
    } else {
      this.add.text(width / 2, height / 2 - 10, `BEST: ${hs.toLocaleString()}`, {
        fontSize: '8px', fontFamily: 'monospace', color: '#aaaaaa',
      }).setOrigin(0.5);
    }

    // Name entry for leaderboard
    this._name = 'NOVA';
    const nameLabel = this.add.text(width / 2, height / 2 + 10, `NAME: ${this._name}`, {
      fontSize: '9px', fontFamily: 'monospace', color: '#aaffaa',
    }).setOrigin(0.5);

    const nameTip = this.add.text(width / 2, height / 2 + 22, '(tap to enter your name)', {
      fontSize: '5px', fontFamily: 'monospace', color: '#666688',
    }).setOrigin(0.5).setInteractive();
    nameTip.on('pointerdown', () => {
      const n = prompt('Enter your name (max 8 chars):', this._name);
      if (n) { this._name = n.substring(0, 8).toUpperCase(); nameLabel.setText(`NAME: ${this._name}`); }
    });

    const btns = [
      { label: '↺ TRY AGAIN', fn: () => this._retry() },
      { label: '⌂ MAIN MENU', fn: () => this._menu() },
      { label: '🏆 LEADERBOARD', fn: () => this._leaderboard() },
    ];

    btns.forEach((b, i) => {
      const txt = this.add.text(width / 2, height / 2 + 45 + i * 22, b.label, {
        fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      txt.on('pointerover', () => txt.setColor('#ffd700'));
      txt.on('pointerout',  () => txt.setColor('#ffffff'));
      txt.on('pointerdown', () => { SFX.menu_select(); b.fn(); });
    });

    // Stats
    const deaths = SaveSystem.get('totalDeaths') || 0;
    const coins  = SaveSystem.get('totalCoinsEver') || 0;
    this.add.text(width / 2, height - 16, `Total Deaths: ${deaths}  |  Total Coins: ${coins}`, {
      fontSize: '5px', fontFamily: 'monospace', color: '#444466',
    }).setOrigin(0.5);

    // Save score to leaderboard
    SaveSystem.addHighScore(this._name, d.score || 0);
    SaveSystem.save();

    SFX.gameover();
    playMusic('menu');
  }

  _retry() {
    SaveSystem.set('lives', PLAYER_LIVES_START);
    SaveSystem.set('score', 0);
    SaveSystem.save();
    this.scene.start(SCENES.GAME, {
      world: this._data.world, level: this._data.level,
      lives: PLAYER_LIVES_START, score: 0,
    });
  }

  _menu() {
    this.scene.start(SCENES.MENU);
  }

  _leaderboard() {
    this.scene.start(SCENES.LEADERBOARD);
  }
}
