import { SCENES, FONT, SKINS } from '../config.js';
import { SFX, playMusic } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

/**
 * Skin Shop — spend vault coins (earned in levels + daily streaks)
 * on palette-swap skins for Nova. Selection persists in the save file.
 */
export default class ShopScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.SHOP }); }

  create() {
    const { width, height } = this.scale;

    // Starfield background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a);
    for (let i = 0; i < 50; i++) {
      const s = this.add.image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 'star_twinkle')
        .setAlpha(Math.random() * 0.6 + 0.2);
      this.tweens.add({ targets: s, alpha: 0.05, duration: Phaser.Math.Between(400, 1500), yoyo: true, repeat: -1 });
    }

    this.add.text(width / 2, 16, '🎨 SKIN SHOP', {
      fontSize: '16px', fontFamily: FONT, color: '#ffd700', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this._bankText = this.add.text(width / 2, 36, '', {
      fontSize: '9px', fontFamily: FONT, color: '#ffdd55',
    }).setOrigin(0.5);

    // Skin grid: 4 × 2
    this._cells = [];
    const cols = 4, cw = 104, ch = 84;
    const gridW = cols * cw;
    const startX = (width - gridW) / 2 + cw / 2;
    const startY = 78;

    SKINS.forEach((skin, i) => {
      const cx = startX + (i % cols) * cw;
      const cy = startY + Math.floor(i / cols) * ch;

      const box = this.add.rectangle(cx, cy, cw - 8, ch - 8, 0x1a1a2e)
        .setStrokeStyle(2, 0x333355).setInteractive({ useHandCursor: true });

      const texKey = skin.colors ? `nova_big_idle_${skin.id}` : 'nova_big_idle';
      this.add.image(cx, cy - 12, texKey).setScale(1.6);

      this.add.text(cx, cy + 14, skin.name, {
        fontSize: '7px', fontFamily: FONT, color: '#ffffff',
      }).setOrigin(0.5);

      const status = this.add.text(cx, cy + 26, '', {
        fontSize: '7px', fontFamily: FONT, color: '#ffd700',
      }).setOrigin(0.5);

      box.on('pointerover', () => this._select(i));
      box.on('pointerdown', () => { this._select(i); this._confirm(); });
      this._cells.push({ skin, box, status });
    });

    // Hint + back
    this._hint = this.add.text(width / 2, height - 28, '', {
      fontSize: '8px', fontFamily: FONT, color: '#aaaaff',
    }).setOrigin(0.5);

    const back = this.add.text(width / 2, height - 12, '[ BACK TO MENU ]', {
      fontSize: '9px', fontFamily: FONT, color: '#ff8888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this._back());

    this._keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,  right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up:   Phaser.Input.Keyboard.KeyCodes.UP,    down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      a: Phaser.Input.Keyboard.KeyCodes.A, d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W, s: Phaser.Input.Keyboard.KeyCodes.S,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER, space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
    });

    this._selectedIdx = SKINS.findIndex(s => s.id === (SaveSystem.get('selectedSkin') || 'classic'));
    if (this._selectedIdx < 0) this._selectedIdx = 0;
    this._refresh();
    playMusic('menu');
  }

  _select(i) {
    if (i === this._selectedIdx) return;
    this._selectedIdx = i;
    SFX.menu_move();
    this._refresh();
  }

  _refresh() {
    const bank = SaveSystem.get('coinBank') || 0;
    const owned = SaveSystem.get('ownedSkins') || ['classic'];
    const equipped = SaveSystem.get('selectedSkin') || 'classic';
    this._bankText.setText(`VAULT: ${bank.toLocaleString()} 🪙`);

    this._cells.forEach(({ skin, box, status }, i) => {
      const isOwned = owned.includes(skin.id);
      const isEquipped = skin.id === equipped;
      box.setStrokeStyle(2, i === this._selectedIdx ? 0xffd700 : 0x333355);
      if (isEquipped)      status.setText('✓ EQUIPPED').setColor('#55ff88');
      else if (isOwned)    status.setText('OWNED').setColor('#88aaff');
      else                 status.setText(`${skin.price} 🪙`).setColor(bank >= skin.price ? '#ffd700' : '#775533');
    });

    const sel = SKINS[this._selectedIdx];
    const isOwned = owned.includes(sel.id);
    if (sel.id === equipped)       this._hint.setText('THIS SKIN IS EQUIPPED');
    else if (isOwned)              this._hint.setText('ENTER/TAP TO EQUIP');
    else if (bank >= sel.price)    this._hint.setText(`ENTER/TAP TO BUY FOR ${sel.price} 🪙`);
    else                           this._hint.setText(`NEED ${(sel.price - bank).toLocaleString()} MORE COINS — PLAY LEVELS & KEEP YOUR STREAK!`);
  }

  _confirm() {
    const sel = SKINS[this._selectedIdx];
    const bank = SaveSystem.get('coinBank') || 0;
    const owned = SaveSystem.get('ownedSkins') || ['classic'];

    if (owned.includes(sel.id)) {
      SaveSystem.set('selectedSkin', sel.id);
      SaveSystem.save();
      SFX.menu_select();
    } else if (bank >= sel.price) {
      SaveSystem.set('coinBank', bank - sel.price);
      SaveSystem.set('ownedSkins', [...owned, sel.id]);
      SaveSystem.set('selectedSkin', sel.id);
      SaveSystem.save();
      SFX.buy();
      this.cameras.main.flash(250, 255, 215, 0);
    } else {
      SFX.menu_move();
    }
    this._refresh();
  }

  _back() {
    SFX.menu_select();
    this.scene.start(SCENES.MENU);
  }

  update() {
    const k = this._keys;
    const J = Phaser.Input.Keyboard.JustDown;
    const cols = 4;
    let idx = this._selectedIdx;
    if (J(k.left)  || J(k.a)) idx = (idx % cols === 0) ? idx + cols - 1 : idx - 1;
    if (J(k.right) || J(k.d)) idx = (idx % cols === cols - 1) ? idx - cols + 1 : idx + 1;
    if (J(k.up)    || J(k.w)) idx = (idx + SKINS.length - cols) % SKINS.length;
    if (J(k.down)  || J(k.s)) idx = (idx + cols) % SKINS.length;
    if (idx !== this._selectedIdx) this._select(idx);
    if (J(k.enter) || J(k.space)) this._confirm();
    if (J(k.esc)) this._back();
  }
}
