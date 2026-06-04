import { SCENES, FONT } from '../config.js';
import { SFX } from '../systems/AudioSystem.js';
import QuestSystem from '../systems/QuestSystem.js';

export default class PauseScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.PAUSE }); }

  init(data) { this._data = data; }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.78).setScrollFactor(0);
    this.add.rectangle(width / 2, height / 2, 260, 200, 0x0d0d1a, 0.97)
      .setStrokeStyle(2, 0xffd700).setScrollFactor(0);

    this.add.text(width / 2, height / 2 - 88, 'PAUSED', {
      fontSize: '18px', fontFamily: FONT,
      color: '#ffd700', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0);

    // Info rows
    const info = [
      `W${this._data.world}-${this._data.level}`,
      `SCORE: ${(this._data.score || 0).toLocaleString()}`,
      `LIVES: ${this._data.lives}`,
    ];
    info.forEach((line, i) => {
      this.add.text(width / 2, height / 2 - 58 + i * 16, line, {
        fontSize: '9px', fontFamily: FONT, color: '#ccccff',
      }).setOrigin(0.5).setScrollFactor(0);
    });

    // Buttons
    const btns = [
      { label: '▶ RESUME',    fn: () => this._resume() },
      { label: '↺ RESTART',   fn: () => this._restart() },
      { label: '✦ QUESTS',    fn: () => this._showQuests() },
      { label: '⌂ MAIN MENU', fn: () => this._menu() },
    ];

    btns.forEach((b, i) => {
      const txt = this.add.text(width / 2, height / 2 + 2 + i * 24, b.label, {
        fontSize: '11px', fontFamily: FONT,
        color: '#ffffff', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
      txt.on('pointerover', () => txt.setColor('#ffd700'));
      txt.on('pointerout',  () => txt.setColor('#ffffff'));
      txt.on('pointerdown', () => { SFX.menu_select(); b.fn(); });
    });

    // Controls hint
    this.add.text(width / 2, height - 22, 'WASD/Arrows+Space — Move & Jump', {
      fontSize: '7px', fontFamily: FONT, color: '#445566',
    }).setOrigin(0.5).setScrollFactor(0);
    this.add.text(width / 2, height - 10, 'Z=Run  X=Fire  Double-tap=Dash  Down=Crouch  ESC=Pause', {
      fontSize: '6px', fontFamily: FONT, color: '#334455',
    }).setOrigin(0.5).setScrollFactor(0);

    this.input.keyboard.once('keydown-ESC', () => this._resume());
  }

  _resume() {
    const g = this.scene.get(SCENES.GAME);
    g._gamePaused = false;
    g.physics.resume();
    SFX.resume();
    this.scene.stop();
  }

  _restart() {
    this.scene.stop(SCENES.UI);
    this.scene.stop(SCENES.GAME);
    this.scene.stop();
    this.scene.start(SCENES.GAME, { world: this._data.world, level: this._data.level });
  }

  _menu() {
    this.scene.stop(SCENES.UI);
    this.scene.stop(SCENES.GAME);
    this.scene.stop();
    this.scene.start(SCENES.MENU);
  }

  _showQuests() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.93).setInteractive();
    this.add.text(width / 2, 14, 'QUEST LOG', {
      fontSize: '12px', fontFamily: FONT, color: '#ffd700',
    }).setOrigin(0.5);

    const quests = QuestSystem.getAllProgress();
    quests.forEach((q, i) => {
      const row  = Math.floor(i / 2);
      const col  = i % 2;
      const x    = col === 0 ? width * 0.25 : width * 0.75;
      const y    = 32 + row * 24;
      const col2 = q.done ? '#55ff55' : '#aaaacc';
      const pct  = q.done ? '✓ DONE' : `${Math.min(q.progress, q.target)}/${q.target}`;
      this.add.text(x, y,     `${q.icon} ${q.name}`, { fontSize: '7px', fontFamily: FONT, color: col2 }).setOrigin(0.5);
      this.add.text(x, y + 10, pct,                   { fontSize: '7px', fontFamily: FONT, color: col2 }).setOrigin(0.5);
    });

    const close = this.add.text(width / 2, height - 16, '[ CLOSE ]', {
      fontSize: '10px', fontFamily: FONT, color: '#ff8888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => { overlay.destroy(); close.destroy(); });
  }
}
