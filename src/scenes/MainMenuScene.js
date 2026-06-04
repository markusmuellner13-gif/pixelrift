import { SCENES, FONT, COLORS } from '../config.js';
import { playMusic, SFX, setMusicEnabled, setSfxEnabled } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.MENU }); }

  create() {
    const { width, height } = this.scale;
    this._buildBackground(width, height);

    // Game title
    this.add.text(width / 2, height * 0.20, 'PIXELRIFT', {
      fontSize: '28px', fontFamily: FONT,
      color: '#ffd700', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.32, 'Leap. Explore. Conquer.', {
      fontSize: '10px', fontFamily: FONT, color: '#aaaaff',
    }).setOrigin(0.5);

    // Menu options
    const options = [
      { label: '▶  PLAY',            scene: 'play' },
      { label: '⭐ DAILY CHALLENGE', scene: SCENES.DAILY },
      { label: '🏆 LEADERBOARD',     scene: SCENES.LEADERBOARD },
      { label: '⚙  SETTINGS',        scene: 'settings' },
    ];

    this._selectedIdx = 0;
    this._optionTexts = [];
    this._options = options;

    options.forEach((opt, i) => {
      const y = height * 0.48 + i * 26;
      const txt = this.add.text(width / 2, y, opt.label, {
        fontSize: '11px', fontFamily: FONT,
        color: i === 0 ? '#ffd700' : '#ffffff',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      txt.on('pointerover', () => this._select(i));
      txt.on('pointerdown', () => this._confirm());
      this._optionTexts.push({ txt, opt });
    });

    // High score
    const hs = SaveSystem.get('highScore') || 0;
    this.add.text(width / 2, height * 0.88, `BEST SCORE: ${hs.toLocaleString()}`, {
      fontSize: '9px', fontFamily: FONT, color: '#ff8888',
    }).setOrigin(0.5);

    // Tap to start (mobile)
    const tap = this.add.text(width / 2, height * 0.96, 'TAP TO START', {
      fontSize: '9px', fontFamily: FONT, color: '#55ffaa',
    }).setOrigin(0.5).setInteractive();
    tap.on('pointerdown', () => this._confirm());
    this.tweens.add({ targets: tap, alpha: 0.15, duration: 700, yoyo: true, repeat: -1 });

    // Controls hint
    this.add.text(width / 2, height - 8,
      'WASD/Arrows Move  Space Jump  Z Run  X Fire  🎮 Controller supported', {
        fontSize: '7px', fontFamily: FONT, color: '#555577',
      }).setOrigin(0.5, 1);

    // Keyboard nav
    this._keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.UP,
      down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      w:     Phaser.Input.Keyboard.KeyCodes.W,
      s:     Phaser.Input.Keyboard.KeyCodes.S,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    playMusic('menu');
  }

  _buildBackground(w, h) {
    this.add.rectangle(w / 2, h / 2, w, h, 0x0d0d1a);
    for (let i = 0; i < 80; i++) {
      const s = this.add.image(
        Phaser.Math.Between(0, w), Phaser.Math.Between(0, h * 0.7),
        'star_twinkle'
      ).setAlpha(Math.random() * 0.7 + 0.3).setScale(Math.random() + 0.5);
      this.tweens.add({
        targets: s, alpha: 0.1,
        duration: Phaser.Math.Between(500, 2000),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1000),
      });
    }
    for (let i = 0; i < 4; i++) {
      this.add.image(
        Phaser.Math.Between(20, w - 60), Phaser.Math.Between(h * 0.5, h * 0.75),
        'moving_platform'
      ).setAlpha(0.3);
    }
    const nova = this.add.image(w / 2 - 20, h * 0.40, 'nova_big_idle').setScale(2.5);
    this.tweens.add({ targets: nova, y: nova.y - 5, duration: 700, yoyo: true, repeat: -1 });
  }

  _select(idx) {
    this._selectedIdx = idx;
    this._optionTexts.forEach(({ txt }, i) => {
      txt.setColor(i === idx ? '#ffd700' : '#ffffff');
      txt.setScale(i === idx ? 1.08 : 1);
    });
    SFX.menu_move();
  }

  _confirm() {
    const opt = this._options[this._selectedIdx];
    SFX.menu_select();
    if (opt.scene === 'play')    { this.scene.start(SCENES.WORLDMAP); }
    else if (opt.scene === SCENES.DAILY) { this.scene.start(SCENES.DAILY); }
    else if (opt.scene === SCENES.LEADERBOARD) { this.scene.start(SCENES.LEADERBOARD); }
    else if (opt.scene === 'settings') { this._showSettings(); }
  }

  _showSettings() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88).setInteractive();
    this.add.rectangle(width / 2, height / 2, 240, 160, 0x1a1a2e).setStrokeStyle(2, 0xffd700);

    this.add.text(width / 2, height / 2 - 60, 'SETTINGS', {
      fontSize: '13px', fontFamily: FONT, color: '#ffd700',
    }).setOrigin(0.5);

    const rows = [
      { label: () => `MUSIC: ${SaveSystem.getSetting('music') ? 'ON' : 'OFF'}`,  key: 'music',  y: -28 },
      { label: () => `SFX:   ${SaveSystem.getSetting('sfx')   ? 'ON' : 'OFF'}`,  key: 'sfx',    y:   2 },
    ];

    const txts = rows.map(row => {
      const t = this.add.text(width / 2, height / 2 + row.y, row.label(), {
        fontSize: '10px', fontFamily: FONT, color: '#ffffff',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        const v = !SaveSystem.getSetting(row.key);
        SaveSystem.updateSetting(row.key, v);
        if (row.key === 'music') setMusicEnabled(v);
        if (row.key === 'sfx')   setSfxEnabled(v);
        t.setText(row.label());
        SFX.menu_select();
      });
      return t;
    });

    const reset = this.add.text(width / 2, height / 2 + 36, '⚠ RESET SAVE DATA', {
      fontSize: '9px', fontFamily: FONT, color: '#ff4444',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    reset.on('pointerdown', () => {
      if (confirm('Reset ALL save data? This cannot be undone!')) {
        SaveSystem.reset();
        this.scene.restart();
      }
    });

    const close = this.add.text(width / 2, height / 2 + 60, '[ CLOSE ]', {
      fontSize: '10px', fontFamily: FONT, color: '#ff8888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => { overlay.destroy(); [close, reset, ...txts].forEach(o => o.destroy()); this.children.each(c => { if (c.getData?.('settingsChild')) c.destroy(); }); });
  }

  update() {
    const k = this._keys;
    if (Phaser.Input.Keyboard.JustDown(k.down) || Phaser.Input.Keyboard.JustDown(k.s)) {
      this._select((this._selectedIdx + 1) % this._optionTexts.length);
    }
    if (Phaser.Input.Keyboard.JustDown(k.up) || Phaser.Input.Keyboard.JustDown(k.w)) {
      this._select((this._selectedIdx - 1 + this._optionTexts.length) % this._optionTexts.length);
    }
    if (Phaser.Input.Keyboard.JustDown(k.enter) || Phaser.Input.Keyboard.JustDown(k.space)) {
      this._confirm();
    }
  }
}
