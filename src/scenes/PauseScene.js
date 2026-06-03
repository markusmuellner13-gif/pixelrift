import { SCENES } from '../config.js';
import { SFX } from '../systems/AudioSystem.js';
import QuestSystem from '../systems/QuestSystem.js';

export default class PauseScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.PAUSE }); }

  init(data) {
    this._data = data;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setScrollFactor(0);

    this.add.text(width / 2, height / 2 - 60, '⏸ PAUSED', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffd700',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0);

    const info = [
      `W${this._data.world}-${this._data.level}`,
      `Score: ${(this._data.score || 0).toLocaleString()}`,
      `Lives: ${this._data.lives}`,
    ];
    info.forEach((line, i) => {
      this.add.text(width / 2, height / 2 - 30 + i * 14, line, {
        fontSize: '8px', fontFamily: 'monospace', color: '#ccccff',
      }).setOrigin(0.5).setScrollFactor(0);
    });

    const btns = [
      { label: '▶ RESUME', fn: () => this._resume() },
      { label: '↺ RESTART', fn: () => this._restart() },
      { label: '✦ QUESTS', fn: () => this._showQuests() },
      { label: '⌂ MENU', fn: () => this._menu() },
    ];

    btns.forEach((b, i) => {
      const txt = this.add.text(width / 2, height / 2 + 18 + i * 18, b.label, {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffffff',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
      txt.on('pointerover', () => txt.setColor('#ffd700'));
      txt.on('pointerout',  () => txt.setColor('#ffffff'));
      txt.on('pointerdown', () => { SFX.menu_select(); b.fn(); });
    });

    // Controls reminder
    this.add.text(width / 2, height - 16, '← → Move | ↑/SPACE Jump | Z Run | X Fire | ESC Pause', {
      fontSize: '5px', fontFamily: 'monospace', color: '#666688',
    }).setOrigin(0.5).setScrollFactor(0);

    this.input.keyboard.once('keydown-ESC', () => this._resume());
  }

  _resume() {
    const gameScene = this.scene.get(SCENES.GAME);
    gameScene._gamePaused = false;
    gameScene.physics.resume();
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
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9).setInteractive();
    this.add.text(width / 2, 20, 'QUESTS', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5);

    const quests = QuestSystem.getAllProgress();
    quests.forEach((q, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = col === 0 ? width * 0.25 : width * 0.75;
      const y = 38 + row * 22;
      const color = q.done ? '#55ff55' : '#aaaacc';
      const pct = q.done ? '✓' : `${Math.min(q.progress, q.target)}/${q.target}`;
      this.add.text(x, y, `${q.icon} ${q.name} [${pct}]`, {
        fontSize: '5px', fontFamily: 'monospace', color,
      }).setOrigin(0.5);
    });

    const close = this.add.text(width / 2, height - 16, '[ CLOSE ]', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ff8888',
    }).setOrigin(0.5).setInteractive();
    close.on('pointerdown', () => { overlay.destroy(); close.destroy(); });
  }
}
