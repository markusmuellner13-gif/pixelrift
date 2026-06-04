import { SCENES, PLAYER_LIVES_START, FONT } from '../config.js';
import { SFX, playMusic } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.GAMEOVER }); }
  init(data) { this._data = data; }

  create() {
    const { width, height } = this.scale;
    const d = this._data;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a);
    // Red flicker
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0.18);
    this.tweens.add({ targets: flash, alpha: 0, duration: 800 });

    this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontSize: '24px', fontFamily: FONT,
      color: '#ff4444', stroke: '#880000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Score
    this.add.text(width / 2, height / 2 - 44, `SCORE: ${(d.score || 0).toLocaleString()}`, {
      fontSize: '12px', fontFamily: FONT, color: '#ffd700',
    }).setOrigin(0.5);

    // High score
    const hs    = SaveSystem.get('highScore') || 0;
    const isNew = (d.score || 0) >= hs && (d.score || 0) > 0;
    this.add.text(width / 2, height / 2 - 22,
      isNew ? '★ NEW HIGH SCORE!' : `BEST: ${hs.toLocaleString()}`, {
        fontSize: '10px', fontFamily: FONT, color: isNew ? '#ffaa00' : '#aaaaaa',
      }).setOrigin(0.5);

    // Name entry (tap label)
    this._playerName = 'NOVA';
    const nameTxt = this.add.text(width / 2, height / 2 - 4, `NAME: ${this._playerName}`, {
      fontSize: '10px', fontFamily: FONT, color: '#aaffaa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const hint = this.add.text(width / 2, height / 2 + 12, 'TAP TO ENTER YOUR NAME', {
      fontSize: '7px', fontFamily: FONT, color: '#556677',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const editName = () => {
      const n = prompt('Your name for the leaderboard (max 10 chars):', this._playerName);
      if (n && n.trim()) {
        this._playerName = n.trim().substring(0, 10).toUpperCase();
        nameTxt.setText(`NAME: ${this._playerName}`);
        SaveSystem.addHighScore(this._playerName, d.score || 0);
        SaveSystem.save();
      }
    };
    nameTxt.on('pointerdown', editName);
    hint.on('pointerdown',    editName);

    // Buttons
    const btns = [
      { label: '↺ TRY AGAIN',   fn: () => this._retry() },
      { label: '⌂ MAIN MENU',   fn: () => this._menu() },
      { label: '🏆 LEADERBOARD', fn: () => this._leaderboard() },
    ];

    btns.forEach((b, i) => {
      const txt = this.add.text(width / 2, height / 2 + 36 + i * 26, b.label, {
        fontSize: '11px', fontFamily: FONT,
        color: '#ffffff', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      txt.on('pointerover', () => txt.setColor('#ffd700'));
      txt.on('pointerout',  () => txt.setColor('#ffffff'));
      txt.on('pointerdown', () => { SFX.menu_select(); b.fn(); });
    });

    // Stats
    const deaths = SaveSystem.get('totalDeaths')   || 0;
    const coins  = SaveSystem.get('totalCoinsEver') || 0;
    this.add.text(width / 2, height - 10,
      `TOTAL DEATHS: ${deaths}   COINS EVER: ${coins}`, {
        fontSize: '7px', fontFamily: FONT, color: '#333355',
      }).setOrigin(0.5, 1);

    SFX.gameover();
    playMusic('menu');

    SaveSystem.addHighScore(this._playerName, d.score || 0);
    SaveSystem.save();
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
  _menu()        { this.scene.start(SCENES.MENU); }
  _leaderboard() { this.scene.start(SCENES.LEADERBOARD); }
}
