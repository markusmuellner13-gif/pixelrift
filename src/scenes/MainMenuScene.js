import { SCENES, COLORS } from '../config.js';
import { playMusic, SFX } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.MENU }); }

  create() {
    const { width, height } = this.scale;

    // Animated starfield background
    this._buildBackground(width, height);

    // Title
    this.add.text(width / 2, height * 0.22, 'PIXELRIFT', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ffd700',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.33, 'Leap. Explore. Conquer.', {
      fontSize: '8px', fontFamily: 'monospace', color: '#aaaaff',
    }).setOrigin(0.5);

    // Menu options
    const options = [
      { label: '▶  PLAY', scene: 'play' },
      { label: '⭐ DAILY CHALLENGE', scene: SCENES.DAILY },
      { label: '🏆 LEADERBOARD', scene: SCENES.LEADERBOARD },
      { label: '⚙  SETTINGS', scene: 'settings' },
    ];

    this._selectedIdx = 0;
    this._optionTexts = [];

    options.forEach((opt, i) => {
      const y = height * 0.50 + i * 22;
      const txt = this.add.text(width / 2, y, opt.label, {
        fontSize: '10px', fontFamily: 'monospace',
        color: i === 0 ? '#ffd700' : '#ffffff',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      txt.on('pointerover', () => { this._select(i); });
      txt.on('pointerdown', () => { this._confirm(options); });
      this._optionTexts.push({ txt, opt });
    });

    // High score display
    const hs = SaveSystem.get('highScore') || 0;
    this.add.text(width / 2, height * 0.78, `BEST: ${hs.toLocaleString()}`, {
      fontSize: '7px', fontFamily: 'monospace', color: '#ffaaaa',
    }).setOrigin(0.5);

    // Keyboard navigation
    this._keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
    });

    // Touch button
    const playBtn = this.add.text(width / 2, height * 0.90, '[ TAP TO START ]', {
      fontSize: '7px', fontFamily: 'monospace', color: '#55ffaa',
    }).setOrigin(0.5).setInteractive();
    playBtn.on('pointerdown', () => this._confirm(options));
    this.tweens.add({ targets: playBtn, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    // Controls hint
    this.add.text(width / 2, height - 10,
      '⌨ ←→/WASD Move  ↑/W/Space Jump  Z/Shift Run  X Fire  |  🎮 Left Stick A B X Start', {
      fontSize: '5px', fontFamily: 'monospace', color: '#666688',
    }).setOrigin(0.5);

    playMusic('menu');
    this._selectAnimTimer = 0;
    this._options = options;
  }

  _buildBackground(w, h) {
    // Dark gradient
    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x0d0d1a);
    // Stars
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h * 0.7);
      const star = this.add.image(x, y, 'star_twinkle').setAlpha(Math.random() * 0.7 + 0.3).setScale(Math.random() + 0.5);
      this.tweens.add({
        targets: star, alpha: 0.1,
        duration: Phaser.Math.Between(500, 2000),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1000),
      });
    }
    // Floating platforms
    for (let i = 0; i < 5; i++) {
      const px = Phaser.Math.Between(20, w - 60);
      const py = Phaser.Math.Between(h * 0.45, h * 0.75);
      this.add.image(px, py, 'moving_platform').setAlpha(0.4);
    }
    // Animated Nova character
    const nova = this.add.image(w / 2 - 20, h * 0.42, 'nova_big_idle').setScale(2);
    this.tweens.add({ targets: nova, y: nova.y - 4, duration: 600, yoyo: true, repeat: -1 });
  }

  _select(idx) {
    this._selectedIdx = idx;
    this._optionTexts.forEach(({ txt }, i) => {
      txt.setColor(i === idx ? '#ffd700' : '#ffffff');
      txt.setScale(i === idx ? 1.1 : 1);
    });
    SFX.menu_move();
  }

  _confirm(options) {
    const opt = options[this._selectedIdx];
    SFX.menu_select();
    if (opt.scene === 'play') {
      this.scene.start(SCENES.WORLDMAP);
    } else if (opt.scene === SCENES.DAILY) {
      this.scene.start(SCENES.DAILY);
    } else if (opt.scene === 'settings') {
      this._showSettings();
    } else {
      this.scene.start(opt.scene);
    }
  }

  _showSettings() {
    const { width, height } = this.scale;
    // Simple overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85).setInteractive();
    const panel = this.add.rectangle(width / 2, height / 2, 200, 120, 0x1a1a2e).setStrokeStyle(2, 0xffd700);

    this.add.text(width / 2, height / 2 - 45, 'SETTINGS', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5);

    const musicOn = SaveSystem.getSetting('music');
    const sfxOn   = SaveSystem.getSetting('sfx');

    const mTxt = this.add.text(width / 2, height / 2 - 20,
      `MUSIC: ${musicOn ? 'ON' : 'OFF'}`, {
        fontSize: '8px', fontFamily: 'monospace', color: '#ffffff'
      }).setOrigin(0.5).setInteractive();

    const sTxt = this.add.text(width / 2, height / 2,
      `SFX: ${sfxOn ? 'ON' : 'OFF'}`, {
        fontSize: '8px', fontFamily: 'monospace', color: '#ffffff'
      }).setOrigin(0.5).setInteractive();

    mTxt.on('pointerdown', () => {
      const v = !SaveSystem.getSetting('music');
      SaveSystem.updateSetting('music', v);
      mTxt.setText(`MUSIC: ${v ? 'ON' : 'OFF'}`);
      SFX.menu_select();
    });
    sTxt.on('pointerdown', () => {
      const v = !SaveSystem.getSetting('sfx');
      SaveSystem.updateSetting('sfx', v);
      sTxt.setText(`SFX: ${v ? 'ON' : 'OFF'}`);
    });

    const closeTxt = this.add.text(width / 2, height / 2 + 25, '[ CLOSE ]', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ff8888',
    }).setOrigin(0.5).setInteractive();
    closeTxt.on('pointerdown', () => {
      overlay.destroy(); panel.destroy();
      mTxt.destroy(); sTxt.destroy(); closeTxt.destroy();
      this.children.getAll().forEach(c => {
        if (c.getData && c.getData('settingsChild')) c.destroy();
      });
    });

    const resetTxt = this.add.text(width / 2, height / 2 + 40, '⚠ RESET SAVE', {
      fontSize: '7px', fontFamily: 'monospace', color: '#ff4444',
    }).setOrigin(0.5).setInteractive();
    resetTxt.on('pointerdown', () => {
      if (confirm('Reset ALL save data? This cannot be undone!')) {
        SaveSystem.reset();
        this.scene.restart();
      }
    });
  }

  update(time, delta) {
    const k = this._keys;
    if (Phaser.Input.Keyboard.JustDown(k.down) || Phaser.Input.Keyboard.JustDown(k.s)) {
      this._select((this._selectedIdx + 1) % this._optionTexts.length);
    }
    if (Phaser.Input.Keyboard.JustDown(k.up) || Phaser.Input.Keyboard.JustDown(k.w)) {
      this._select((this._selectedIdx - 1 + this._optionTexts.length) % this._optionTexts.length);
    }
    if (Phaser.Input.Keyboard.JustDown(k.enter) || Phaser.Input.Keyboard.JustDown(k.space)) {
      this._confirm(this._options);
    }
  }
}
